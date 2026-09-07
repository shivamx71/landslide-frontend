/* =========================================================
   dashboard.js (Integrated with SIH Live Satellite Risk API)
   ========================================================= */
const API_BASE_URL = "https://sih-landslide-backend-kzl9.onrender.com";

initShell({ active: 'dashboard.html', title: 'Command Dashboard', crumb: 'Monitor / Dashboard' });

// Default Fallback Locations (Agar server sleep mode me ho to UI blank na ho)
let locationsList = typeof DEMO_LOCATIONS !== 'undefined' ? [...DEMO_LOCATIONS] : [
  { id: 1, name: "East Sikkim" },
  { id: 2, name: "Aizawl" },
  { id: 3, name: "Guwahati" }
];

let activeLocationId = lsGet(LS_KEYS.ACTIVE_LOCATION, 1);

function setNeedle(score) {
  const angle = -90 + (Math.min(100, Math.max(0, score)) / 100) * 180;
  const needle = document.getElementById('db-needle');
  if (needle) needle.style.transform = `rotate(${angle}deg)`;
}

// 1. Dropdown populate karna (/locations se)
function renderLocationSelect() {
  const sel = document.getElementById('location-select');
  if (!sel) return;

  sel.innerHTML = locationsList.map(l => 
    `<option value="${l.id}" ${String(l.id) === String(activeLocationId) ? 'selected' : ''}>${l.name}</option>`
  ).join('');

  sel.onchange = () => {
    activeLocationId = parseInt(sel.value) || sel.value;
    lsSet(LS_KEYS.ACTIVE_LOCATION, activeLocationId);
    fetchLiveDistrictRisk(activeLocationId);
  };
}

// 2. LIVE DATA ko Dashboard ke Cards me display karna
function updateDashboardUI(data) {
  const telemetry = data.live_telemetry || {};
  const baseline = data.geotechnical_baseline || {};
  const aiRisk = data.realtime_ai_risk_assessment || {};

  const score = Math.round(aiRisk.risk_score ?? 0);
  const level = (aiRisk.risk_level || 'moderate').toLowerCase();
  const rm = riskMeta(level);

  // Cards Data Update
  if (document.getElementById('db-loc-name')) document.getElementById('db-loc-name').textContent = data.district || "NER Zone";
  if (document.getElementById('db-score')) document.getElementById('db-score').textContent = score;
  if (document.getElementById('db-rainfall')) document.getElementById('db-rainfall').innerHTML = (telemetry.rainfall_24h_mm ?? 0) + ' <small>mm</small>';
  if (document.getElementById('db-soil')) document.getElementById('db-soil').innerHTML = (telemetry.soil_moisture_percent ?? 0) + '<small>%</small>';
  if (document.getElementById('db-slope')) document.getElementById('db-slope').innerHTML = (baseline.slope_degrees ?? 0) + '<small>°</small>';
  if (document.getElementById('db-elev')) document.getElementById('db-elev').innerHTML = (baseline.elevation_meters ?? 0) + '<small>m</small>';
  if (document.getElementById('db-hist')) document.getElementById('db-hist').textContent = baseline.isro_past_incidents ?? 0;
  if (document.getElementById('db-alerts-count')) document.getElementById('db-alerts-count').textContent = score > 60 ? '1 Active' : '0';

  // Live Timestamp
  const syncTimeEl = document.getElementById('db-sync-time');
  if (syncTimeEl) {
    syncTimeEl.textContent = data.fetch_timestamp ? new Date(data.fetch_timestamp).toLocaleTimeString() : 'Live Satellite';
  }

  // Risk Badge
  const badge = document.getElementById('db-status-badge');
  if (badge) {
    badge.className = 'badge badge-' + rm.cls;
    badge.innerHTML = `<span class="badge-dot"></span> ${rm.label}`;
  }

  // Advisory / Warning Banner
  const warnLine = document.getElementById('db-warn-line');
  if (warnLine) {
    if (aiRisk.advisory) {
      warnLine.style.display = 'flex';
      warnLine.textContent = `⚠️ ${aiRisk.advisory}`;
    } else {
      warnLine.style.display = 'none';
    }
  }

  // Needle Meter Animation
  setTimeout(() => setNeedle(score), 150);
}

// 3. API Call: Ek District ka Live Satellite Risk Fetch karna
async function fetchLiveDistrictRisk(locId) {
  const syncEl = document.getElementById('db-sync-time');
  if (syncEl) syncEl.textContent = 'fetching satellite data...';

  try {
    const response = await fetch(`${API_BASE_URL}/live-risk/${locId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const liveData = await response.json();
    console.log(">>> [LIVE SATELLITE TELEMETRY RECEIVED]:", liveData);
    updateDashboardUI(liveData);
  } catch (err) {
    console.warn("Live API fetch fallback:", err);
    if (syncEl) syncEl.textContent = 'offline (fallback mode)';
  }
}

// 4. API Call: Saare Districts fetch karke dropdown aur priority list banana
async function initDashboard() {
  renderLocationSelect();
  renderDashboardMap();
  renderHistChart();

  try {
    const res = await fetch(`${API_BASE_URL}/locations`);
    if (res.ok) {
      const dbLocations = await res.json();
      if (Array.isArray(dbLocations) && dbLocations.length > 0) {
        locationsList = dbLocations;
        renderLocationSelect();
      }
    }
  } catch (e) {
    console.warn("Locations load error, using default locations:", e);
  }

  // Pehli baar live risk call karo
  fetchLiveDistrictRisk(activeLocationId);

  // Har 30 second mein live satellite telemetry refresh
  setInterval(() => {
    fetchLiveDistrictRisk(activeLocationId);
  }, 30000);
}

function renderPriorityList(){
  const listEl = document.getElementById('db-priority-list');
  if (!listEl) return;
  const demoList = typeof DEMO_LOCATIONS !== 'undefined' ? DEMO_LOCATIONS : [];
  const ranked = [...demoList].sort((a,b) => b.riskScore - a.riskScore).slice(0,4);
  listEl.innerHTML = ranked.map((l, i) => {
    const rm = riskMeta(l.riskLevel);
    return `
      <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border-soft);">
        <div style="font-family:var(--font-mono); font-weight:700; color:var(--text-faint); width:20px;">${i+1}</div>
        <div style="flex:1;">
          <div style="font-weight:600; font-size:13.5px;">${l.name}</div>
          <div style="font-size:11.5px; color:var(--text-faint);">Score ${l.riskScore} · ${l.roadStatus?.replace('-',' ') || 'Open'}</div>
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
    addLocationMarkers(map, typeof DEMO_LOCATIONS !== 'undefined' ? DEMO_LOCATIONS : []);
  }
}

function renderHistChart(){
  const canvas = document.getElementById('db-hist-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const histData = typeof HISTORICAL_LANDSLIDES !== 'undefined' 
    ? HISTORICAL_LANDSLIDES.filter(h => h.location === 'East Sikkim') 
    : [];
  drawSimpleBarChart(ctx, canvas, histData.map(d => d.year), histData.map(d => d.deaths), '#FF5252', 'Impact events');
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

// Start Dashboard Execution
renderPriorityList();
initDashboard();