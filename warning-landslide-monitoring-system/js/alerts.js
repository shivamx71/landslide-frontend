/* =========================================================
   alerts.js — 100% 24x7 Real-Time AI & Satellite Alerts Engine
   ========================================================= */

initShell({ active: 'alerts.html', title: 'Alerts', crumb: 'Monitor / Alerts' });

const API_BASE = typeof BACKEND_URL !== 'undefined' ? BACKEND_URL : "https://sih-landslide-backend-kzl9.onrender.com";

let currentFilter = 'all';
let liveAlertsList = [];

// Normalize severity strings to: 'critical', 'high', 'moderate', 'low'
function normalizeSeverity(sev = '') {
  const s = String(sev).toLowerCase();
  if (s.includes('critical') || s.includes('seismic') || s.includes('red')) return 'critical';
  if (s.includes('high') || s.includes('amber') || s.includes('warning')) return 'high';
  if (s.includes('mod') || s.includes('watch') || s.includes('yellow')) return 'moderate';
  return 'low';
}

function severityIcon(sev) {
  const s = normalizeSeverity(sev);
  return { critical: '🚨', high: '⚠️', moderate: '🟡', low: '🟢' }[s] || '⚠️';
}

// Format Relative Time or Exact Timestamp
function formatAlertTime(dateStr) {
  if (!dateStr) return 'Just now';
  if (typeof timeAgo === 'function') {
    try {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) return timeAgo(dateStr);
    } catch (e) {}
  }
  return dateStr;
}

// ---------------- RENDER ALERTS UI ----------------
function renderAlerts() {
  const all = [...liveAlertsList].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));

  // Count Badges Update
  const critEl = document.getElementById('cnt-critical');
  const highEl = document.getElementById('cnt-high');
  const modEl = document.getElementById('cnt-mod');

  if (critEl) critEl.textContent = all.filter(a => normalizeSeverity(a.severity) === 'critical' && a.status === 'active').length;
  if (highEl) highEl.textContent = all.filter(a => normalizeSeverity(a.severity) === 'high' && a.status === 'active').length;
  if (modEl) modEl.textContent = all.filter(a => normalizeSeverity(a.severity) === 'moderate' && a.status === 'active').length;

  let list = all;
  if (currentFilter === 'acknowledged') {
    list = all.filter(a => a.status === 'acknowledged');
  } else if (currentFilter !== 'all') {
    list = all.filter(a => normalizeSeverity(a.severity) === currentFilter && a.status !== 'dismissed');
  } else {
    list = all.filter(a => a.status !== 'dismissed');
  }

  const container = document.getElementById('alerts-list');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="panel">
        <div class="empty-state">
          <div class="ic">✅</div>
          <div style="font-weight:600; font-size:15px; margin-top:6px;">All Clear in This Category</div>
          <div style="font-size:12.5px; color:var(--text-faint); margin-top:2px;">Automated 24x7 satellite radar monitoring is actively scanning NER sectors.</div>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(a => {
    const acked = a.status === 'acknowledged';
    const normSev = normalizeSeverity(a.severity);
    const rm = (typeof riskMeta === 'function') 
      ? riskMeta(normSev) 
      : { cls: normSev === 'critical' ? 'danger' : normSev === 'high' ? 'warning' : 'info', label: normSev.toUpperCase() };

    return `
      <div class="alert-card sev-${normSev} ${acked ? 'acknowledged' : ''}" style="border-left: 4px solid ${a.color || '#ea580c'}; margin-bottom: 14px;">
        <div class="a-icon" style="font-size: 22px;">${severityIcon(a.severity)}</div>
        <div class="a-body" style="width: 100%;">
          <div class="a-title" style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:700; font-size:15px;">${a.title}</span>
            <div>
              <span class="badge badge-${rm.cls}" style="border: 1px solid ${a.color || '#ea580c'};">${rm.label}</span>
              ${acked ? '<span class="badge" style="background:var(--bg-raised); color:var(--text-faint); margin-left:6px;">ACKNOWLEDGED</span>' : ''}
            </div>
          </div>

          <div class="a-meta" style="margin-top:4px; font-size:12px; color:var(--text-faint);">
            <b>${a.location}</b> · Risk Index: <b style="color:${a.color};">${a.riskScore}/100</b> · 24h Rain: <b>${a.rainfall24h}mm</b> · Soil: <b>${a.soilMoisture}%</b> · <span>${formatAlertTime(a.timestamp)}</span>
          </div>

          <p style="margin:8px 0 6px; font-size:13px; color:var(--text-main); line-height:1.4;">${a.message}</p>

          ${a.actionAdvisory ? `
            <div style="background: rgba(255,255,255,0.03); border: 1px dashed var(--border-soft); padding: 8px 10px; border-radius: 6px; margin: 8px 0; font-size: 12px; color: #38bdf8;">
              <b>🚨 Action Directive:</b> ${a.actionAdvisory}
            </div>
          ` : ''}

          <div class="a-actions" style="margin-top:10px; display:flex; gap:8px;">
            <button class="btn btn-ghost btn-sm" onclick="viewLocationOnMap('${a.locationId}', ${a.latitude || 26.0}, ${a.longitude || 92.0})">
              📍 View Location on GIS Map
            </button>
            ${!acked ? `<button class="btn btn-outline btn-sm" onclick="acknowledgeAlert('${a.id}')">Acknowledge</button>` : ''}
            <button class="btn btn-danger btn-sm" onclick="dismissAlert('${a.id}')">Dismiss</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ---------------- LIVE FASTAPI BACKEND FETCH (/alerts) ----------------
async function fetchLiveBackendAlerts() {
  try {
    const res = await fetch(`${API_BASE}/alerts?threshold=35`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const backendAlerts = await res.json();
    console.log(">>> [24x7 REAL-TIME ALERTS]:", backendAlerts);

    if (Array.isArray(backendAlerts)) {
      const savedStates = (typeof lsGet === 'function') ? lsGet('wlms_alert_states', {}) : {};

      liveAlertsList = backendAlerts.map((a, idx) => {
        const normSev = normalizeSeverity(a.severity);
        const locClean = String(a.location || 'ner').replace(/\s+/g, '-').toLowerCase();
        const alertId = a.id ? String(a.id) : `AL-LIVE-${locClean}-${idx}`;

        let titleText = `${normSev.toUpperCase()} LANDSLIDE WARNING`;
        if (a.primary_factor && a.primary_factor.includes('Tremor')) {
          titleText = 'SEISMIC GROUND-MOTION ALERT';
        } else if (normSev === 'critical') {
          titleText = 'CRITICAL RED HAZARD WARNING';
        } else if (normSev === 'high') {
          titleText = 'HIGH RISK METEOROLOGICAL ALERT';
        } else {
          titleText = 'REGIONAL ADVISORY WATCH';
        }

        return {
          id: alertId,
          locationId: a.id ? String(a.id).replace('LOC-', '') : '',
          location: a.location,
          latitude: a.latitude,
          longitude: a.longitude,
          title: titleText,
          message: a.message,
          actionAdvisory: a.action_advisory || null,
          riskScore: Math.round(a.risk_score || 50),
          severity: normSev,
          color: a.color || (normSev === 'critical' ? '#dc2626' : normSev === 'high' ? '#ea580c' : '#ca8a04'),
          rainfall24h: Number(a.rainfall_24h || 0).toFixed(1),
          soilMoisture: Number(a.soil_moisture || 0).toFixed(1),
          timestamp: a.timestamp || new Date().toISOString(),
          status: savedStates[alertId] || 'active'
        };
      });

      if (typeof lsSet === 'function') lsSet(LS_KEYS.ALERTS, liveAlertsList);
      renderAlerts();
    }
  } catch (err) {
    console.warn("Alerts API cold-starting/offline, local cache retained:", err);
    if (typeof lsGet === 'function') liveAlertsList = lsGet(LS_KEYS.ALERTS, []);
    renderAlerts();
  }
}

// Navigation to Map Page
window.viewLocationOnMap = function(locId, lat, lon) {
  if (locId) {
    window.location.href = `risk-map.html?loc=${locId}`;
  } else {
    window.location.href = `risk-map.html`;
  }
};

window.acknowledgeAlert = function(id) {
  const a = liveAlertsList.find(x => x.id === id);
  if (a) a.status = 'acknowledged';
  
  const savedStates = (typeof lsGet === 'function') ? lsGet('wlms_alert_states', {}) : {};
  savedStates[id] = 'acknowledged';
  if (typeof lsSet === 'function') {
    lsSet('wlms_alert_states', savedStates);
    lsSet(LS_KEYS.ALERTS, liveAlertsList);
  }

  if (typeof toast === 'function') toast('Alert marked as Acknowledged', 'success');
  renderAlerts();
};

window.dismissAlert = function(id) {
  const a = liveAlertsList.find(x => x.id === id);
  if (a) a.status = 'dismissed';

  const savedStates = (typeof lsGet === 'function') ? lsGet('wlms_alert_states', {}) : {};
  savedStates[id] = 'dismissed';
  if (typeof lsSet === 'function') {
    lsSet('wlms_alert_states', savedStates);
    lsSet(LS_KEYS.ALERTS, liveAlertsList);
  }

  if (typeof toast === 'function') toast('Alert dismissed from active queue', 'error');
  renderAlerts();
};

// Filter Chip Click Listeners
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.filter || 'all';
    renderAlerts();
  });
});

// ---------------- INITIAL RUN & 24x7 POLLING ----------------
if (typeof lsGet === 'function') liveAlertsList = lsGet(LS_KEYS.ALERTS, []);
renderAlerts();

fetchLiveBackendAlerts();

// 24x7 Auto-refresh every 30 seconds
setInterval(fetchLiveBackendAlerts, 30000);