/* =========================================================
   road-monitoring.js — 24x7 Dynamic Highway & Corridor Tracker
   ========================================================= */

initShell({ active: 'road-monitoring.html', title: 'Road Monitoring', crumb: 'Field Ops / Road Monitoring' });

const API_BASE = typeof BACKEND_URL !== 'undefined' ? BACKEND_URL : "https://sih-landslide-backend-kzl9.onrender.com";

let currentFilter = 'all';

// Strategic Highway Arteries in North-East Region mapped to monitored districts
const NER_HIGHWAYS = [
  { id: 'NH-10',  name: 'Sevoke – Gangtok Highway',        districtKey: 'sikkim',     location: 'East Sikkim',   baselineStatus: 'open' },
  { id: 'NH-717A', name: 'Bagrakote – Pakyong Corridor',   districtKey: 'sikkim',     location: 'East Sikkim',   baselineStatus: 'open' },
  { id: 'NH-13',  name: 'Trans-Arunachal Highway',         districtKey: 'kameng',     location: 'West Kameng',   baselineStatus: 'open' },
  { id: 'NH-29',  name: 'Dimapur – Kohima Spur Route',     districtKey: 'kohima',     location: 'Kohima',        baselineStatus: 'open' },
  { id: 'NH-54',  name: 'Silchar – Aizawl Mountain Route', districtKey: 'aizawl',     location: 'Aizawl',        baselineStatus: 'open' },
  { id: 'NH-06',  name: 'Shillong – Silchar Highway',      districtKey: 'jaintia',    location: 'Jaintia Hills', baselineStatus: 'open' },
  { id: 'NH-102', name: 'Imphal – Moreh Border Transit',   districtKey: 'churachand', location: 'Churachandpur', baselineStatus: 'open' },
  { id: 'NH-40',  name: 'Guwahati – Shillong Expressway',  districtKey: 'ribhoi',     location: 'Ribhoi',        baselineStatus: 'open' },
  { id: 'NH-115', name: 'Doomdooma – Pasighat Corridor',   districtKey: 'siang',      location: 'East Siang',    baselineStatus: 'open' },
  { id: 'NH-202', name: 'Mokokchung – Tuensang Pass',      districtKey: 'tuensang',   location: 'Tuensang',      baselineStatus: 'open' }
];

let liveRoads = typeof ROAD_SEGMENTS !== 'undefined' ? [...ROAD_SEGMENTS] : [...NER_HIGHWAYS];

function statusBadge(status) {
  const s = (status || 'open').toLowerCase();
  const map = {
    open:      { label: 'Open',     color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    'at-risk': { label: 'At Risk',  color: '#ea580c', bg: 'rgba(234,88,12,0.12)' },
    blocked:   { label: 'Blocked',  color: '#dc2626', bg: 'rgba(220,38,38,0.12)' }
  };
  const m = map[s] || map.open;
  return `<span class="badge" style="background:${m.bg}; color:${m.color}; border: 1px solid ${m.color}44;">
    <span class="badge-dot" style="background:${m.color}"></span>${m.label}
  </span>`;
}

// ---------------- 1. CANVAS DONUT CHART RENDERER ----------------
function drawDonutChart(openPct, atRiskPct, blockedPct) {
  const canvas = document.getElementById('road-donut');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 260;
  const h = 220;

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) / 2 - 20;
  const thickness = 22;

  const total = openPct + atRiskPct + blockedPct;
  if (total <= 0) return;

  const slices = [
    { pct: openPct,    color: '#22c55e' }, // Green
    { pct: atRiskPct,  color: '#ea580c' }, // Orange
    { pct: blockedPct, color: '#dc2626' }  // Red
  ];

  let startAngle = -Math.PI / 2;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'butt';

  slices.forEach(s => {
    if (s.pct <= 0) return;
    const sweep = (s.pct / total) * (Math.PI * 2);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, startAngle + sweep);
    ctx.strokeStyle = s.color;
    ctx.stroke();
    startAngle += sweep;
  });

  // Center Text (Dynamic connectivity percentage)
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 26px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${openPct}%`, cx, cy - 8);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 11px Inter, sans-serif';
  ctx.fillText('Open Connectivity', cx, cy + 16);
}

// ---------------- 2. STATS & DONUT UPDATE ----------------
function updateStats() {
  const total = liveRoads.length || 1;
  const openCount = liveRoads.filter(r => r.status === 'open').length;
  const atRiskCount = liveRoads.filter(r => r.status === 'at-risk').length;
  const blockedCount = liveRoads.filter(r => r.status === 'blocked').length;

  const openPct = Math.round((openCount / total) * 100);
  const atRiskPct = Math.round((atRiskCount / total) * 100);
  const blockedPct = Math.max(0, 100 - openPct - atRiskPct);

  // Stat cards update
  const lowCard = document.querySelector('.stat-card.c-low .s-value');
  const highCard = document.querySelector('.stat-card.c-high .s-value');
  const critCard = document.querySelector('.stat-card.c-crit .s-value');

  if (lowCard) lowCard.innerHTML = `${openPct}<small>%</small>`;
  if (highCard) highCard.innerHTML = `${atRiskPct}<small>%</small>`;
  if (critCard) critCard.innerHTML = `${blockedPct}<small>%</small>`;

  // Draw Donut Canvas
  drawDonutChart(openPct, atRiskPct, blockedPct);
}

// ---------------- 3. RENDER ROADS TABLE ----------------
function renderRoadsTable() {
  const filtered = currentFilter === 'all' 
    ? liveRoads 
    : liveRoads.filter(r => r.status.toLowerCase() === currentFilter.toLowerCase());

  // Update segments count header
  const countTag = document.getElementById('road-count');
  if (countTag) {
    countTag.textContent = `${filtered.length} segments`;
  }

  const tbody = document.getElementById('road-table-body');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:24px; color:var(--text-faint);">No roads matching this filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td>
        <div style="font-weight:700; font-size:14px; color:var(--text-main); font-family:monospace;">${r.id}</div>
        <div style="font-size:12px; color:var(--text-faint);">${r.name}</div>
      </td>
      <td style="font-weight:500;">${r.location}</td>
      <td>${statusBadge(r.status)}</td>
      <td style="font-size:12px; color:var(--text-faint); font-family:monospace;">${r.lastUpdate}</td>
      <td style="font-size:12.5px; color:var(--text-dim); max-width:320px; line-height:1.4;">${r.note}</td>
    </tr>
  `).join('');

  updateStats();
}

// ---------------- 4. CORRELATE HIGHWAY STATUS WITH LIVE SATELLITE RADAR ----------------
async function syncHighwaysWithLiveTelemetry() {
  try {
    const res = await fetch(`${API_BASE}/locations?live=true`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const liveLocations = await res.json();
    if (!Array.isArray(liveLocations) || liveLocations.length === 0) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Dynamically evaluate each highway based on its district's live telemetry
    liveRoads = NER_HIGHWAYS.map(h => {
      // Find matching district in live data
      const matched = liveLocations.find(l => 
        l.name.toLowerCase().includes(h.districtKey) || 
        l.name.toLowerCase().includes(h.location.toLowerCase())
      ) || liveLocations[0];

      const rain24h = Number(matched.rainfall_24h || 0);
      const soil = Number(matched.soil_moisture || 0);
      const riskScore = Number(matched.risk_score || 40);

      let roadStatus = 'open';
      let advisoryNote = `Passable under normal mountain speed guidelines. Sector rainfall: ${rain24h.toFixed(1)}mm.`;

      if (riskScore >= 75 || rain24h >= 65.0 || (soil >= 80.0 && rain24h >= 40.0)) {
        roadStatus = 'blocked';
        advisoryNote = `🚨 TRAFFIC HALTED: High probability of active debris flow. Live 24h Rain: ${rain24h.toFixed(1)}mm, Soil Saturation: ${soil.toFixed(0)}%. BRO clearing teams dispatched.`;
      } else if (riskScore >= 55 || rain24h >= 35.0 || soil >= 70.0) {
        roadStatus = 'at-risk';
        advisoryNote = `⚠️ ELEVATED SLIPPAGE RISK: Saturated cut slopes. Light vehicular movement permitted with caution. Night transit restricted.`;
      }

      return {
        id: h.id,
        name: h.name,
        location: h.location,
        status: roadStatus,
        lastUpdate: `${timeStr} (Live Radar)`,
        note: advisoryNote
      };
    });

    renderRoadsTable();
    console.log(">>> [HIGHWAY TELEMETRY] Roads dynamically updated with live satellite data!");

  } catch (err) {
    console.warn("Highway live sync warning:", err);
  }
}

// Filter listeners
document.querySelectorAll('.chip-row .chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip-row .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.filter || 'all';
    renderRoadsTable();
  });
});

// ---------------- INITIAL RUN & 24x7 POLLING ----------------
renderRoadsTable();
syncHighwaysWithLiveTelemetry();

// 24x7 live update every 30 seconds
setInterval(syncHighwaysWithLiveTelemetry, 30000);