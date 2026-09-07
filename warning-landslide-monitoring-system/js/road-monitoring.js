/* =========================================================
   road-monitoring.js — Zero Overload Highway Tracker
   ========================================================= */

initShell({ active: 'road-monitoring.html', title: 'Road Monitoring', crumb: 'Field Ops / Road Monitoring' });

let currentFilter = 'all';

// Active district ka risk check karo jo dashboard se sync hua tha
const activeLocId = lsGet(LS_KEYS.ACTIVE_LOCATION, 'east-sikkim');
let liveRoads = ROAD_SEGMENTS.map(r => {
  // Agar East Sikkim active hai to uski highway ko live dynamic highlight do
  return { ...r };
});

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

function renderRoadsTable(){
  const filtered = currentFilter === 'all' 
    ? liveRoads 
    : liveRoads.filter(r => r.status.toLowerCase() === currentFilter.toLowerCase());

  const tbody = document.getElementById('road-table-body');
  if (!tbody) return;

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

function updateStats(){
  const total = liveRoads.length || 1;
  const openCount = liveRoads.filter(r => r.status === 'open').length;
  const atRiskCount = liveRoads.filter(r => r.status === 'at-risk').length;
  const blockedCount = liveRoads.filter(r => r.status === 'blocked').length;

  const openPct = Math.round((openCount / total) * 100);
  const atRiskPct = Math.round((atRiskCount / total) * 100);
  const blockedPct = 100 - openPct - atRiskPct;

  if (document.getElementById('stat-open-pct')) document.getElementById('stat-open-pct').textContent = openPct + '%';
  if (document.getElementById('stat-risk-pct')) document.getElementById('stat-risk-pct').textContent = atRiskPct + '%';
  if (document.getElementById('stat-blocked-pct')) document.getElementById('stat-blocked-pct').textContent = blockedPct + '%';
  if (document.getElementById('donut-open-pct')) document.getElementById('donut-open-pct').textContent = openPct + '%';
}

// Filter button tabs ("All roads", "Open", "At Risk", "Blocked")
document.querySelectorAll('.filter-chip, .chip').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip, .chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter || 'all';
    renderRoadsTable();
  });
});

renderRoadsTable();