/* =========================================================
   alerts.js
   ========================================================= */

initShell({ active: 'alerts.html', title: 'Alerts', crumb: 'Monitor / Alerts' });

let currentFilter = 'all';

function severityIcon(sev){
  return { critical: '🔴', high: '🟠', moderate: '🟡' }[sev] || '🟢';
}

function renderAlerts(){
  const all = lsGet(LS_KEYS.ALERTS, []).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  document.getElementById('cnt-critical').textContent = all.filter(a => a.severity==='critical' && a.status==='active').length;
  document.getElementById('cnt-high').textContent = all.filter(a => a.severity==='high' && a.status==='active').length;
  document.getElementById('cnt-mod').textContent = all.filter(a => a.severity==='moderate' && a.status==='active').length;

  let list = all;
  if (currentFilter === 'acknowledged') list = all.filter(a => a.status === 'acknowledged');
  else if (currentFilter !== 'all') list = all.filter(a => a.severity === currentFilter && a.status !== 'dismissed');
  else list = all.filter(a => a.status !== 'dismissed');

  const container = document.getElementById('alerts-list');
  if (list.length === 0){
    container.innerHTML = `<div class="panel"><div class="empty-state"><div class="ic">✅</div>No alerts match this filter.</div></div>`;
    return;
  }

  container.innerHTML = list.map(a => {
    const acked = a.status === 'acknowledged';
    const loc = DEMO_LOCATIONS.find(l => l.name === a.location);
    return `
      <div class="alert-card sev-${a.severity} ${acked ? 'acknowledged' : ''}">
        <div class="a-icon">${severityIcon(a.severity)}</div>
        <div class="a-body">
          <div class="a-title">
            ${a.title}
            <span class="badge badge-${riskMeta(a.severity).cls}">${a.severity.toUpperCase()}</span>
            ${acked ? '<span class="badge" style="background:var(--bg-raised); color:var(--text-faint);">ACKNOWLEDGED</span>' : ''}
          </div>
          <div class="a-meta">${a.location} · Risk Score ${a.riskScore}/100 · ${timeAgo(a.createdAt)}</div>
          <p style="margin:8px 0 0; font-size:13px; color:var(--text-dim);">${a.message}</p>
          <div class="a-actions">
            <button class="btn btn-ghost btn-sm" onclick="viewOnMap('${loc ? loc.id : ''}')">View Location</button>
            ${!acked ? `<button class="btn btn-outline btn-sm" onclick="acknowledgeAlert('${a.id}')">Acknowledge</button>` : ''}
            <button class="btn btn-danger btn-sm" onclick="dismissAlert('${a.id}')">Dismiss</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function viewOnMap(locId){
  window.location.href = locId ? `risk-map.html?loc=${locId}` : 'risk-map.html';
}

function acknowledgeAlert(id){
  const alerts = lsGet(LS_KEYS.ALERTS, []);
  const a = alerts.find(x => x.id === id);
  if (a) a.status = 'acknowledged';
  lsSet(LS_KEYS.ALERTS, alerts);
  toast('Alert acknowledged', 'success');
  renderAlerts();
}

function dismissAlert(id){
  const alerts = lsGet(LS_KEYS.ALERTS, []);
  const a = alerts.find(x => x.id === id);
  if (a) a.status = 'dismissed';
  lsSet(LS_KEYS.ALERTS, alerts);
  toast('Alert dismissed', 'error');
  renderAlerts();
}

document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.filter;
    renderAlerts();
  });
});

renderAlerts();
