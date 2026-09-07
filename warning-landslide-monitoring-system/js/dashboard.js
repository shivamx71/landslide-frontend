/* =========================================================
   dashboard.js — Integrated with Live Satellite Risk Telemetry
   ========================================================= */
const API_BASE_URL = "https://sih-landslide-backend-kzl9.onrender.com";

initShell({ active: 'dashboard.html', title: 'Command Dashboard', crumb: 'Monitor / Dashboard' });

// District Text-to-Integer ID Fallback Mapping
const DISTRICT_MAP = {
  'east-sikkim': 1,
  'gangtok': 2,
  'aizawl': 3,
  'kohima': 4,
  'shillong': 5
};

let currentLocations = [...DEMO_LOCATIONS];

// Active location integer id check
let rawSavedId = lsGet(LS_KEYS.ACTIVE_LOCATION, 1);
let activeLocationId = parseInt(rawSavedId) || DISTRICT_MAP[rawSavedId] || 1;
let activeLoc = getLocationById(activeLocationId);

function setNeedle(score){
  const numScore = Number(score) || 0;
  const clamped = Math.max(0, Math.min(100, numScore));
  const angle = -90 + (clamped / 100) * 180;
  const needle = document.getElementById('db-needle');
  if (needle) needle.style.transform = `rotate(${angle}deg)`;
}

function renderLocationSelect(){
  const sel = document.getElementById('location-select');
  if (!sel) return;
  sel.innerHTML = currentLocations.map(l => 
    `<option value="${l.id}" ${String(l.id) === String(activeLocationId) ? 'selected' : ''}>${l.name}</option>`
  ).join('');

  sel.onchange = () => {
    const val = sel.value;
    activeLocationId = parseInt(val) || DISTRICT_MAP[val] || 1;
    lsSet(LS_KEYS.ACTIVE_LOCATION, activeLocationId);
    activeLoc = currentLocations.find(l => String(l.id) === String(activeLocationId)) || currentLocations[0];
    renderLocation();
    fetchLiveDistrictRisk(activeLocationId);
  };
}

function renderLocation(){
  if (!activeLoc) return;
  const rm = riskMeta(activeLoc.riskLevel || 'moderate');
  
  if (document.getElementById('db-loc-name')) document.getElementById('db-loc-name').textContent = activeLoc.name;
  if (document.getElementById('db-score')) document.getElementById('db-score').textContent = activeLoc.riskScore ?? '--';
  if (document.getElementById('db-rainfall')) document.getElementById('db-rainfall').innerHTML = (activeLoc.rainfall ?? 0) + ' <small>mm</small>';
  if (document.getElementById('db-soil')) document.getElementById('db-soil').innerHTML = (activeLoc.soilMoisture ?? 0) + '<small>%</small>';
  if (document.getElementById('db-slope')) document.getElementById('db-slope').innerHTML = (activeLoc.slope ?? 0) + '<small>°</small>';
  if (document.getElementById('db-elev')) document.getElementById('db-elev').innerHTML = (activeLoc.elevation ?? 0) + '<small>m</small>';
  if (document.getElementById('db-hist')) document.getElementById('db-hist').textContent = activeLoc.historicalLandslides ?? 'Low';
  if (document.getElementById('db-alerts-count')) document.getElementById('db-alerts-count').textContent = activeLoc.activeAlerts ?? 0;

  const badge = document.getElementById('db-status-badge');
  if (badge) {
    badge.className = 'badge badge-' + rm.cls;
    badge.innerHTML = `<span class="badge-dot"></span> ${rm.label}`;
  }

  const warnLine = document.getElementById('db-warn-line');
  if (warnLine) {
    if (activeLoc.riskLevel === 'critical'){
      warnLine.style.display = 'flex';
      warnLine.textContent = '⚠️ Immediate monitoring required';
    } else if (activeLoc.riskLevel === 'high'){
      warnLine.style.display = 'flex';
      warnLine.textContent = '⚠️ Field inspection recommended';
    } else {
      warnLine.style.display = 'none';
    }
  }

  setTimeout(() => setNeedle(activeLoc.riskScore), 150);
}

// Update UI with 100% Real Live Satellite Telemetry
function updateWithLiveTelemetry(liveData) {
  const telemetry = liveData.live_telemetry || {};
  const baseline = liveData.geotechnical_baseline || {};
  const aiRisk = liveData.realtime_ai_risk_assessment || {};

  const score = Math.round(aiRisk.risk_score ?? activeLoc.riskScore);
  const level = (aiRisk.risk_level || 'moderate').toLowerCase();
  const rm = riskMeta(level);

  if (document.getElementById('db-loc-name')) document.getElementById('db-loc-name').textContent = liveData.district || activeLoc.name;
  if (document.getElementById('db-score')) document.getElementById('db-score').textContent = score;
  if (document.getElementById('db-rainfall')) document.getElementById('db-rainfall').innerHTML = (telemetry.rainfall_24h_mm ?? 0) + ' <small>mm</small>';
  if (document.getElementById('db-soil')) document.getElementById('db-soil').innerHTML = (telemetry.soil_moisture_percent ?? 0) + '<small>%</small>';
  if (document.getElementById('db-slope')) document.getElementById('db-slope').innerHTML = (baseline.slope_degrees ?? activeLoc.slope) + '<small>°</small>';
  if (document.getElementById('db-elev')) document.getElementById('db-elev').innerHTML = (baseline.elevation_meters ?? activeLoc.elevation) + '<small>m</small>';
  if (document.getElementById('db-hist')) document.getElementById('db-hist').textContent = baseline.isro_past_incidents ?? activeLoc.historicalLandslides;

  const syncTimeEl = document.getElementById('db-sync-time');
  if (syncTimeEl) {
    syncTimeEl.textContent = liveData.fetch_timestamp ? new Date(liveData.fetch_timestamp).toLocaleTimeString() : 'Live Satellite';
  }

  const badge = document.getElementById('db-status-badge');
  if (badge) {
    badge.className = 'badge badge-' + rm.cls;
    badge.innerHTML = `<span class="badge-dot"></span> ${rm.label}`;
  }

  const warnLine = document.getElementById('db-warn-line');
  if (warnLine) {
    if (aiRisk.advisory) {
      warnLine.style.display = 'flex';
      warnLine.textContent = `⚠️ ${aiRisk.advisory}`;
    } else {
      warnLine.style.display = 'none';
    }
  }

  setTimeout(() => setNeedle(score), 150);
}

// Fetch Live Satellite Risk using Integer District ID
async function fetchLiveDistrictRisk(locId) {
  const syncTimeEl = document.getElementById('db-sync-time');
  if (syncTimeEl) syncTimeEl.textContent = 'fetching satellite data...';

  let targetId = parseInt(locId);
  if (isNaN(targetId)) {
    targetId = DISTRICT_MAP[locId] || 1;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/live-risk/${targetId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const liveData = await response.json();
    console.log(">>> [LIVE SATELLITE TELEMETRY SUCCESS]:", liveData);
    updateWithLiveTelemetry(liveData);

  } catch (error) {
    console.warn("Live API fallback (Render waking up or offline):", error);
    if (syncTimeEl) syncTimeEl.textContent = 'offline (fallback mode)';
  }
}

// Fetch backend registered locations list
async function loadBackendLocations() {
  try {
    const res = await fetch(`${API_BASE_URL}/locations`);
    if (res.ok) {
      const locs = await res.json();
      if (Array.isArray(locs) && locs.length > 0) {
        currentLocations = locs.map(l => ({
          ...l,
          id: l.id,
          name: l.name,
          riskScore: l.riskScore || 50,
          riskLevel: l.riskLevel || 'moderate'
        }));
        renderLocationSelect();
      }
    }
  } catch (err) {
    console.warn("Using default locations, backend initializing...");
  }
}

function renderPriorityList(){
  const list = document.getElementById('db-priority-list');
  if (!list) return;
  const ranked = [...currentLocations].sort((a,b) => (b.riskScore || 0) - (a.riskScore || 0)).slice(0,4);
  list.innerHTML = ranked.map((l, i) => {
    const rm = riskMeta(l.riskLevel || 'moderate');
    return `
      <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border-soft);">
        <div style="font-family:var(--font-mono); font-weight:700; color:var(--text-faint); width:20px;">${i+1}</div>
        <div style="flex:1;">
          <div style="font-weight:600; font-size:13.5px;">${l.name}</div>
          <div style="font-size:11.5px; color:var(--text-faint);">Score ${l.riskScore || '--'} · ${l.roadStatus ? l.roadStatus.replace('-',' ') : 'open'}</div>
        </div>
        <span class="badge badge-${rm.cls}">${rm.label}</span>
      </div>
    `;
  }).join('');
}

function renderDashboardMap(){
  const mapContainer = document.getElementById('dashboard-map');
  if (!mapContainer || mapContainer._leaflet_id) return;
  const map = baseMap('dashboard-map', [26.0, 91.8], 5.6);
  if (typeof addLocationMarkers === 'function') {
    addLocationMarkers(map, currentLocations);
  }
}

function renderHistChart(){
  const canvas = document.getElementById('db-hist-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const data = typeof HISTORICAL_LANDSLIDES !== 'undefined' 
    ? HISTORICAL_LANDSLIDES.filter(h => h.location === 'East Sikkim') 
    : [];
  drawSimpleBarChart(ctx, canvas, data.map(d => d.year), data.map(d => d.deaths), '#FF5252', 'Impact events');
}

function drawSimpleBarChart(ctx, canvas, labels, values, color, ylabel){
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.height;
  canvas.width = w*dpr; canvas.height = h*dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0,0,w,h);
  const max = Math.max(...values, 1);
  const padL = 30, padB = 24, padT = 10;
  const barW = (w - padL - 10) / (values.length || 1) * 0.6;
  const gap = (w - padL - 10) / (values.length || 1);
  ctx.strokeStyle = '#223040'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(padL, h-padB); ctx.lineTo(w-5, h-padB); ctx.stroke();
  values.forEach((v,i) => {
    const barH = (v/max) * (h - padT - padB);
    const x = padL + i*gap + (gap-barW)/2;
    const y = h - padB - barH;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, barW, barH, 4) : ctx.rect(x,y,barW,barH);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#647588';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i], x+barW/2, h-8);
    ctx.fillStyle = '#93A6B5';
    ctx.fillText(v, x+barW/2, y-6);
  });
}

// 1. Initial UI Render (Instant fallback)
renderLocationSelect();
renderLocation();
renderPriorityList();
renderDashboardMap();
renderHistChart();

// 2. Load locations from DB & trigger live risk
loadBackendLocations();
fetchLiveDistrictRisk(activeLocationId);

// 3. 30 Second Live Polling
setInterval(() => {
  fetchLiveDistrictRisk(activeLocationId);
}, 30000);