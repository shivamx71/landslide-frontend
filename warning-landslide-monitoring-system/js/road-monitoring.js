/* =========================================================
   road-monitoring.js
   ========================================================= */

initShell({ active: 'road-monitoring.html', title: 'Road Monitoring', crumb: 'Field Ops / Road Monitoring' });

let roadFilter = 'all';

function drawDonut(){
  const canvas = document.getElementById('road-donut');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 260, h = canvas.height;
  canvas.width = w*dpr; canvas.height = h*dpr;
  ctx.scale(dpr, dpr);
  const cx = w/2, cy = h/2, r = Math.min(w,h)/2 - 10, lw = 26;
  const segs = [ { v: 68, c: '#3ED07C' }, { v: 22, c: '#FF9A3D' }, { v: 10, c: '#FF5252' } ];
  let start = -Math.PI/2;
  segs.forEach(s => {
    const angle = (s.v/100) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, start+angle);
    ctx.strokeStyle = s.c;
    ctx.lineWidth = lw;
    ctx.lineCap = 'butt';
    ctx.stroke();
    start += angle;
  });
  ctx.fillStyle = '#E8EFF4';
  ctx.font = '700 26px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('68%', cx, cy+4);
  ctx.fillStyle = '#647588';
  ctx.font = '11px Inter, sans-serif';
  ctx.fillText('Open connectivity', cx, cy+22);
}

function statusBadge(status){
  const map = { open: ['badge-low','🟢 Open'], 'at-risk': ['badge-high','🟠 At Risk'], blocked: ['badge-crit','🔴 Blocked'] };
  const [cls, label] = map[status];
  return `<span class="badge ${cls}">${label}</span>`;
}

function renderRoadTable(){
  let rows = ROAD_SEGMENTS;
  if (roadFilter !== 'all') rows = rows.filter(r => r.status === roadFilter);
  document.getElementById('road-count').textContent = rows.length + ' segments';
  document.getElementById('road-table-body').innerHTML = rows.map(r => `
    <tr>
      <td><span class="mono text-dim">${r.id}</span><br><span style="font-weight:600;">${r.name}</span></td>
      <td>${r.location}</td>
      <td>${statusBadge(r.status)}</td>
      <td class="text-faint">${r.lastUpdate}</td>
      <td class="text-dim" style="max-width:260px;">${r.note}</td>
    </tr>
  `).join('');
}

document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    roadFilter = chip.dataset.filter;
    renderRoadTable();
  });
});

drawDonut();
renderRoadTable();
