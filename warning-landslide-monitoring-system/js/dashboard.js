/* =========================================================
   dashboard.js — 100% 24x7 Real-Time Live Satellite Telemetry
   ========================================================= */
const API_BASE_URL = "https://sih-landslide-backend-kzl9.onrender.com";

initShell({ active: 'dashboard.html', title: 'Command Dashboard', crumb: 'Monitor / Dashboard' });

const DISTRICT_MAP = {
  'south-sikkim': 1,
  'east-sikkim': 2,
  'gangtok': 2,
  'imphal-west': 3,
  'aizawl': 4,
  'lawngtlai': 5,
  'north-sikkim': 6,
  'churachandpur': 7,
  'kohima': 35,
  'shillong': 9,
  'tawang': 14
};

let currentLocations = typeof DEMO_LOCATIONS !== 'undefined' ? [...DEMO_LOCATIONS] : [];

let rawSavedId = (typeof lsGet === 'function') ? lsGet(LS_KEYS.ACTIVE_LOCATION, 2) : 2;
let activeLocationId = parseInt(rawSavedId) || DISTRICT_MAP[String(rawSavedId).toLowerCase()] || 2;
let activeLoc = null;

// Real-Time Seconds Ticker Tracking
let lastSyncTimestamp = Date.now();

function updateLiveSecondsTicker() {
  const syncTimeEl = document.getElementById('db-sync-time');
  if (!syncTimeEl) return;
  const secondsAgo = Math.max(0, Math.floor((Date.now() - lastSyncTimestamp) / 1000));
  const timeText = secondsAgo < 5 ? 'Just now' : `${secondsAgo}s ago`;
  syncTimeEl.innerHTML = `<span style="color:#22c55e;">●</span> Live Satellite (${timeText} • Streaming)`;
}
setInterval(updateLiveSecondsTicker, 1000);

function normalizeLocationData(raw) {
  if (!raw) return null;
  const score = Math.round(raw.risk_score ?? raw.riskScore ?? 45);
  const rawLevel = (raw.risk_level ?? raw.riskLevel ?? (score >= 75 ? 'CRITICAL' : score >= 55 ? 'HIGH' : score >= 35 ? 'MODERATE' : 'LOW')).toLowerCase();
  
  return {
    id: raw.id,
    name: raw.name || raw.district || 'Unknown Location',
    latitude: raw.latitude ?? 26.0,
    longitude: raw.longitude ?? 91.8,
    riskScore: score,
    riskLevel: rawLevel,
    color: raw.color || (score >= 75 ? '#dc2626' : score >= 55 ? '#ea580c' : score >= 35 ? '#ca8a04' : '#16a34a'),
    rainfall: Number(raw.rainfall_24h ?? raw.rainfall_24h_mm ?? raw.rainfall ?? 0).toFixed(1),
    rainfall7d: Number(raw.rainfall_7d ?? raw.rainfall_7d_cumulative_mm ?? 0).toFixed(1),
    soilMoisture: Number(raw.soil_moisture ?? raw.soil_moisture_percent ?? raw.soilMoisture ?? 40).toFixed(1),
    slope: Number(raw.slope ?? raw.slope_degrees ?? 25).toFixed(0),
    elevation: Number(raw.elevation ?? raw.elevation_meters ?? 1200).toFixed(0),
    historicalLandslides: raw.historical_landslides ?? raw.historical_incidents ?? 'Moderate',
    temperature: raw.temperature ?? raw.temperature_c ?? 21,
    weatherCondition: raw.weather_condition ?? 'Partly Cloudy',
    advisory: raw.advisory || raw.primary_factor || null
  };
}

function setNeedle(score) {
  const numScore = Number(score) || 0;
  const clamped = Math.max(0, Math.min(100, numScore));
  const angle = -90 + (clamped / 100) * 180;
  const needle = document.getElementById('db-needle');
  if (needle) {
    needle.style.transition = 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
    needle.style.transform = `rotate(${angle}deg)`;
  }
}

function renderLocationSelect() {
  const sel = document.getElementById('location-select');
  if (!sel || !currentLocations.length) return;

  sel.innerHTML = currentLocations.map(l => 
    `<option value="${l.id}" ${String(l.id) === String(activeLocationId) ? 'selected' : ''}>${l.name}</option>`
  ).join('');

  sel.onchange = () => {
    const val = sel.value;
    activeLocationId = parseInt(val) || DISTRICT_MAP[val] || 1;
    if (typeof lsSet === 'function') lsSet(LS_KEYS.ACTIVE_LOCATION, activeLocationId);
    activeLoc = currentLocations.find(l => String(l.id) === String(activeLocationId)) || currentLocations[0];
    renderLocation();
    fetchLiveDistrictRisk(activeLocationId);
  };
}

function renderLocation() {
  if (!activeLoc) return;
  const rm = (typeof riskMeta === 'function') 
    ? riskMeta(activeLoc.riskLevel || 'moderate') 
    : { cls: 'warning', label: String(activeLoc.riskLevel).toUpperCase() };
  
  if (document.getElementById('db-loc-name')) document.getElementById('db-loc-name').textContent = activeLoc.name;
  if (document.getElementById('db-score')) document.getElementById('db-score').textContent = activeLoc.riskScore ?? '--';
  if (document.getElementById('db-rainfall')) document.getElementById('db-rainfall').innerHTML = `${activeLoc.rainfall} <small>mm</small>`;
  if (document.getElementById('db-soil')) document.getElementById('db-soil').innerHTML = `${activeLoc.soilMoisture}<small>%</small>`;
  if (document.getElementById('db-slope')) document.getElementById('db-slope').innerHTML = `${activeLoc.slope}<small>°</small>`;
  if (document.getElementById('db-elev')) document.getElementById('db-elev').innerHTML = `${activeLoc.elevation}<small>m</small>`;
  if (document.getElementById('db-hist')) document.getElementById('db-hist').textContent = activeLoc.historicalLandslides;

  const badge = document.getElementById('db-status-badge');
  if (badge) {
    badge.className = `badge badge-${rm.cls}`;
    badge.innerHTML = `<span class="badge-dot" style="background-color: ${activeLoc.color};"></span> ${rm.label}`;
  }

  const warnLine = document.getElementById('db-warn-line');
  if (warnLine) {
    if (activeLoc.advisory) {
      warnLine.style.display = 'flex';
      warnLine.innerHTML = `⚠️ ${activeLoc.advisory}`;
    } else if (activeLoc.riskScore >= 75) {
      warnLine.style.display = 'flex';
      warnLine.innerHTML = '⚠️ Critical Alert: Immediate DDMA monitoring required';
    } else if (activeLoc.riskScore >= 55) {
      warnLine.style.display = 'flex';
      warnLine.innerHTML = '⚠️ High Alert: Slope inspection recommended';
    } else {
      warnLine.style.display = 'none';
    }
  }

  setTimeout(() => setNeedle(activeLoc.riskScore), 100);
}

async function fetchLiveDistrictRisk(locId) {
  let targetId = parseInt(locId);
  if (isNaN(targetId)) targetId = DISTRICT_MAP[locId] || 2;

  try {
    const response = await fetch(`${API_BASE_URL}/live-risk/${targetId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const liveData = await response.json();
    const telemetry = liveData.live_telemetry || {};
    const baseline = liveData.geotechnical_baseline || {};
    const aiRisk = liveData.realtime_ai_risk_assessment || {};

    activeLoc = normalizeLocationData({
      id: targetId,
      district: liveData.district,
      risk_score: aiRisk.risk_score,
      risk_level: aiRisk.risk_level,
      color: aiRisk.color,
      rainfall_24h: telemetry.rainfall_24h_mm,
      rainfall_7d: telemetry.rainfall_7d_cumulative_mm,
      soil_moisture: telemetry.soil_moisture_percent,
      slope: baseline.slope_degrees,
      elevation: baseline.elevation_meters,
      historical_incidents: baseline.historical_incidents,
      temperature: telemetry.temperature_c,
      weather_condition: telemetry.weather_condition,
      advisory: aiRisk.advisory
    });

    renderLocation();

    // Reset ticker to "Just now" on each real-time update
    lastSyncTimestamp = Date.now();
    updateLiveSecondsTicker();

  } catch (error) {
    console.warn("Satellite live API delayed/cold-starting:", error);
  }
}

async function loadBackendLocations() {
  try {
    const res = await fetch(`${API_BASE_URL}/locations?live=true`);
    if (res.ok) {
      const locs = await res.json();
      if (Array.isArray(locs) && locs.length > 0) {
        currentLocations = locs.map(l => normalizeLocationData(l));
        renderLocationSelect();
        renderPriorityList();

        const updatedActive = currentLocations.find(l => Number(l.id) === Number(activeLocationId));
        if (updatedActive) {
          activeLoc = updatedActive;
          renderLocation();
        }

        if (typeof addLocationMarkers === 'function' && window._dashMapInstance) {
          addLocationMarkers(window._dashMapInstance, currentLocations);
        }
      }
    }
  } catch (err) {
    console.warn("Backend warming up, fallback retained:", err);
  }
}

async function fetchLiveAlerts() {
  try {
    const res = await fetch(`${API_BASE_URL}/alerts`);
    if (res.ok) {
      const alerts = await res.json();
      if (Array.isArray(alerts)) {
        const alertsCountEl = document.getElementById('db-alerts-count');
        if (alertsCountEl) alertsCountEl.textContent = alerts.length;

        const navAlertBadges = document.querySelectorAll('.nav-alert-badge, [data-alert-badge], [data-shell-alert-badge]');
        navAlertBadges.forEach(b => b.textContent = alerts.length);
      }
    }
  } catch (e) {}
}

function renderPriorityList() {
  const list = document.getElementById('db-priority-list');
  if (!list || !currentLocations.length) return;

  const ranked = [...currentLocations].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0)).slice(0, 4);
  list.innerHTML = ranked.map((l, i) => {
    const rm = (typeof riskMeta === 'function') 
      ? riskMeta(l.riskLevel || 'moderate') 
      : { cls: 'warning', label: l.riskLevel.toUpperCase() };

    return `
      <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border-soft); cursor:pointer;" 
           onclick="selectDistrictById(${l.id})">
        <div style="font-family:var(--font-mono); font-weight:700; color:var(--text-faint); width:20px;">${i + 1}</div>
        <div style="flex:1;">
          <div style="font-weight:600; font-size:13.5px; color:var(--text-main);">${l.name}</div>
          <div style="font-size:11.5px; color:var(--text-faint);">Rain ${l.rainfall}mm · Soil ${l.soilMoisture}%</div>
        </div>
        <span class="badge badge-${rm.cls}" style="border: 1px solid ${l.color};">${l.riskScore} · ${rm.label}</span>
      </div>
    `;
  }).join('');
}

window.selectDistrictById = function(id) {
  activeLocationId = id;
  const sel = document.getElementById('location-select');
  if (sel) sel.value = String(id);
  activeLoc = currentLocations.find(l => Number(l.id) === Number(id));
  renderLocation();
  fetchLiveDistrictRisk(id);
};

function renderDashboardMap() {
  const mapContainer = document.getElementById('dashboard-map');
  if (!mapContainer || mapContainer._leaflet_id) return;
  
  if (typeof baseMap === 'function') {
    window._dashMapInstance = baseMap('dashboard-map', [26.0, 91.8], 5.8);
    if (typeof addLocationMarkers === 'function') {
      addLocationMarkers(window._dashMapInstance, currentLocations);
    }
  }
}

function renderHistChart() {
  const canvas = document.getElementById('db-hist-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const data = (typeof HISTORICAL_LANDSLIDES !== 'undefined') 
    ? HISTORICAL_LANDSLIDES.filter(h => h.location === 'East Sikkim' || h.location === 'Gangtok') 
    : [
        { year: '2020', deaths: 4 },
        { year: '2021', deaths: 7 },
        { year: '2022', deaths: 3 },
        { year: '2023', deaths: 12 },
        { year: '2024', deaths: 5 }
      ];

  if (typeof drawSimpleBarChart === 'function') {
    drawSimpleBarChart(ctx, canvas, data.map(d => d.year), data.map(d => d.deaths), '#ef4444', 'Impact events');
  }
}

// ---------------- INITIAL RENDER & POLLING ----------------
if (currentLocations.length > 0) {
  activeLoc = currentLocations.find(l => Number(l.id) === Number(activeLocationId)) || currentLocations[0];
  renderLocationSelect();
  renderLocation();
  renderPriorityList();
}
renderDashboardMap();
renderHistChart();

loadBackendLocations();
fetchLiveDistrictRisk(activeLocationId);
fetchLiveAlerts();

// Polling every 15 seconds for continuous live refresh
setInterval(() => {
  fetchLiveDistrictRisk(activeLocationId);
  fetchLiveAlerts();
}, 15000);