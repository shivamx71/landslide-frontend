/* =========================================================
   alerts.js — Live AI & Satellite Alerts Engine
   ========================================================= */

initShell({ active: 'alerts.html', title: 'Alerts', crumb: 'Monitor / Alerts' });

const API_BASE = typeof BACKEND_URL !== 'undefined' ? BACKEND_URL : "https://sih-landslide-backend-kzl9.onrender.com";

let currentFilter = 'all';
let liveAlertsList = [];

function severityIcon(sev){
  const s = (sev || '').toLowerCase();
  return { critical: '🔴', high: '🟠', moderate: '🟡' }[s] || '🟢';
}

// ---------------- RENDER ALERTS UI ----------------
function renderAlerts(){
  const all = [...liveAlertsList].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Count Badges update
  const critEl = document.getElementById('cnt-critical');
  const highEl = document.getElementById('cnt-high');
  const modEl = document.getElementById('cnt-mod');

  if (critEl) critEl.textContent = all.filter(a => a.severity === 'critical' && a.status === 'active').length;
  if (highEl) highEl.textContent = all.filter(a => a.severity === 'high' && a.status === 'active').length;
  if (modEl) modEl.textContent = all.filter(a => a.severity === 'moderate' && a.status === 'active').length;

  let list = all;
  if (currentFilter === 'acknowledged') {
    list = all.filter(a => a.status === 'acknowledged');
  } else if (currentFilter !== 'all') {
    list = all.filter(a => a.severity === currentFilter && a.status !== 'dismissed');
  } else {
    list = all.filter(a => a.status !== 'dismissed');
  }

  const container = document.getElementById('alerts-list');
  if (!container) return;

  if (list.length === 0){
    container.innerHTML = `<div class="panel"><div class="empty-state"><div class="ic">✅</div>No alerts match this filter.</div></div>`;
    return;
  }

  container.innerHTML = list.map(a => {
    const acked = a.status === 'acknowledged';
    const loc = typeof DEMO_LOCATIONS !== 'undefined' ? DEMO_LOCATIONS.find(l => l.name === a.location) : null;
    const sevClass = (a.severity || 'high').toLowerCase();
    
    return `
      <div class="alert-card sev-${sevClass} ${acked ? 'acknowledged' : ''}">
        <div class="a-icon">${severityIcon(sevClass)}</div>
        <div class="a-body">
          <div class="a-title">
            ${a.title}
            <span class="badge badge-${riskMeta(sevClass).cls}">${sevClass.toUpperCase()}</span>
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

// ---------------- LIVE BACKEND API FETCH (/alerts) ----------------
async function fetchLiveBackendAlerts() {
  try {
    const res = await fetch(`${API_BASE}/alerts`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const backendAlerts = await res.json();
    console.log(">>> [FASTAPI] Live Critical Alerts received:", backendAlerts);

    if (Array.isArray(backendAlerts) && backendAlerts.length > 0) {
      // Local dismiss/ack states restore karna
      const savedStates = lsGet('wlms_alert_states', {});

      liveAlertsList = backendAlerts.map((a, idx) => {
        const alertId = `AL-LIVE-${a.location.replace(/\s+/g, '-').toLowerCase()}-${idx}`;
        const sev = (a.severity || 'critical').toLowerCase();
        
        return {
          id: alertId,
          location: a.location,
          title: sev === 'critical' ? 'LANDSLIDE WARNING' : 'ELEVATED RISK ADVISORY',
          message: a.message,
          riskScore: Math.round(a.risk_score || 80),
          severity: sev,
          createdAt: new Date().toISOString(),
          status: savedStates[alertId] || 'active'
        };
      });

      lsSet(LS_KEYS.ALERTS, liveAlertsList);
      renderAlerts();
    }
  } catch (err) {
    console.warn(">>> [FASTAPI] Using cached alerts fallback:", err);
    // Offline fallback to LocalStorage
    liveAlertsList = lsGet(LS_KEYS.ALERTS, []);
    renderAlerts();
  }
}

function viewOnMap(locId){
  window.location.href = locId ? `risk-map.html?loc=${locId}` : 'risk-map.html';
}

function acknowledgeAlert(id){
  const a = liveAlertsList.find(x => x.id === id);
  if (a) a.status = 'acknowledged';
  
  const savedStates = lsGet('wlms_alert_states', {});
  savedStates[id] = 'acknowledged';
  lsSet('wlms_alert_states', savedStates);
  lsSet(LS_KEYS.ALERTS, liveAlertsList);

  if (typeof toast === 'function') toast('Alert acknowledged', 'success');
  renderAlerts();
}

function dismissAlert(id){
  const a = liveAlertsList.find(x => x.id === id);
  if (a) a.status = 'dismissed';

  const savedStates = lsGet('wlms_alert_states', {});
  savedStates[id] = 'dismissed';
  lsSet('wlms_alert_states', savedStates);
  lsSet(LS_KEYS.ALERTS, liveAlertsList);

  if (typeof toast === 'function') toast('Alert dismissed', 'error');
  renderAlerts();
}

// Chip filter listeners
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.filter;
    renderAlerts();
  });
});

// Initial load: Pehle local cache render karo, fir live backend call karo
liveAlertsList = lsGet(LS_KEYS.ALERTS, []);
renderAlerts();

fetchLiveBackendAlerts();

// Har 30 second me live alerts refresh
setInterval(fetchLiveBackendAlerts, 30000);