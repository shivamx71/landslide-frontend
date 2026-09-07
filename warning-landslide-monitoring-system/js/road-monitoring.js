/* =========================================================
   road-monitoring.js — Live Highway Tracker with Donut Chart
   ========================================================= */

initShell({ active: 'road-monitoring.html', title: 'Road Monitoring', crumb: 'Field Ops / Road Monitoring' });

let currentFilter = 'all';
let liveRoads = typeof ROAD_SEGMENTS !== 'undefined' ? [...ROAD_SEGMENTS] : [];

function statusBadge(status){
  const s = (status || 'open').toLowerCase();
  const map = {
    open:      { label: 'Open',     color: '#3ED07C', bg: 'rgba(62,208,124,0.12)' },
    'at-risk': { label: 'At Risk',  color: '#FF9A3D', bg: 'rgba(255,154,61,0.12)' },
    blocked:   { label: 'Blocked',  color: '#FF5252', bg: 'rgba(255,82,82,0.12)' }
  };
  const m = map[s] || map.open;
  return `<span class="badge" style="background:${m.bg}; color:${m.color};"><span class="badge-dot" style="background:${m.color}"></span>${m.label}</span>`;
}

// ---------------- 1. CANVAS DONUT CHART RENDERER ----------------
function drawDonutChart(openPct, atRiskPct, blockedPct){
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
    { pct: openPct,    color: '#3ED07C' }, // Green
    { pct: atRiskPct,  color: '#FF9A3D' }, // Orange
    { pct: blockedPct, color: '#FF5252' }  // Red
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

  // Center Text (68% Open connectivity)
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 26px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${openPct}%`, cx, cy - 8);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px "Inter", sans-serif';
  ctx.fillText('Open connectivity', cx, cy + 16);
}

// ---------------- 2. STATS & DONUT UPDATE ----------------
function updateStats(){
  const total = liveRoads.length || 1;
  const openCount = liveRoads.filter(r => r.status === 'open').length;
  const atRiskCount = liveRoads.filter(r => r.status === 'at-risk').length;
  const blockedCount = liveRoads.filter(r => r.status === 'blocked').length;

  const openPct = Math.round((openCount / total) * 100);
  const atRiskPct = Math.round((atRiskCount / total) * 100);
  const blockedPct = 100 - openPct - atRiskPct;

  // Stat cards update
  const lowCard = document.querySelector('.stat-card.c-low .s-value');
  const highCard = document.querySelector('.stat-card.c-high .s-value');
  const critCard = document.querySelector('.stat-card.c-crit .s-value');

  if (lowCard) lowCard.innerHTML = `${openPct}<small>%</small>`;
  if (highCard) highCard.innerHTML = `${atRiskPct}<small>%</small>`;
  if (critCard) critCard.innerHTML = `${blockedPct}<small>%</small>`;

  // Draw Donut
  drawDonutChart(openPct, atRiskPct, blockedPct);
}

// ---------------- 3. RENDER ROADS TABLE ----------------
function renderRoadsTable(){
  const filtered = currentFilter === 'all' 
    ? liveRoads 
    : liveRoads.filter(r => r.status.toLowerCase() === currentFilter.toLowerCase());

  // Update segments count header (e.g. "10 segments")
  const countTag = document.getElementById('road-count');
  if (countTag) {
    countTag.textContent = `${filtered.length} segments`;
  }

  const tbody = document.getElementById('road-table-body');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--text-faint);">No roads matching this filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td>
        <div style="font-weight:600; font-size:13.5px;">${r.id}</div>
        <div style="font-size:12px; color:var(--text-faint);">${r.name}</div>
      </td>
      <td style="font-weight:500;">${r.location}</td>
      <td>${statusBadge(r.status)}</td>
      <td style="font-size:12px; color:var(--text-faint);">${r.lastUpdate}</td>
      <td style="font-size:12.5px; color:var(--text-dim); max-width:280px;">${r.note}</td>
    </tr>
  `).join('');

  updateStats();
}

// ---------------- 4. FILTER LISTENERS ----------------
document.querySelectorAll('.chip-row .chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip-row .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.filter || 'all';
    renderRoadsTable();
  });
});

// Initial Render
renderRoadsTable();