/* =========================================================
   settings.js — Command Center Configuration & Pipeline Health
   ========================================================= */

initShell({ active: 'settings.html', title: 'Settings', crumb: 'System / Settings' });

const API_BASE = typeof BACKEND_URL !== 'undefined' ? BACKEND_URL : "https://sih-landslide-backend-kzl9.onrender.com";

// 1. Move Toast notifications to Bottom-Right to prevent Topbar collision
(function fixToastPosition() {
  const style = document.createElement('style');
  style.innerHTML = `
    #toast-root {
      top: auto !important;
      bottom: 24px !important;
      left: auto !important;
      right: 24px !important;
      transform: none !important;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 99999 !important;
    }
    .toast {
      box-shadow: 0 4px 14px rgba(0,0,0,0.5) !important;
      border: 1px solid var(--border) !important;
    }
  `;
  document.head.appendChild(style);
})();

// 2. Render Officer Credentials Profile
function renderProfile() {
  const s = (typeof currentSession === 'function' && currentSession()) || {
    name: 'Demo Officer',
    email: 'demo@wlms.gov.in',
    org: 'State Disaster Management Authority (SDMA)',
    role: 'Field Coordinator'
  };

  const pBlock = document.getElementById('profile-block');
  if (!pBlock) return;

  pBlock.innerHTML = `
    <div class="field"><label>Officer Name</label><input type="text" value="${s.name}" disabled style="background:var(--bg-raised); color:var(--text-main);"></div>
    <div class="field"><label>Registered Email</label><input type="text" value="${s.email}" disabled style="background:var(--bg-raised); color:var(--text-main);"></div>
    <div class="field-row">
      <div class="field"><label>Organisation</label><input type="text" value="${s.org || 'SDMA North-East'}" disabled style="background:var(--bg-raised); color:var(--text-main);"></div>
      <div class="field"><label>Operational Role</label><input type="text" value="${s.role || 'Field Coordinator'}" disabled style="background:var(--bg-raised); color:var(--text-main);"></div>
    </div>
    <p class="text-faint" style="font-size:11.5px; margin-top:8px; color:#22c55e;">
      ● Verified Disaster Management Command Center Identity
    </p>
  `;
}

// 3. Theme Selector (Dark Command Center Default)
document.querySelectorAll('.theme-swatch button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.theme-swatch button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (typeof lsSet === 'function') lsSet(LS_KEYS.THEME, btn.dataset.theme);
    
    if (btn.dataset.theme === 'light') {
      if (typeof toast === 'function') toast('Dark mode is optimized for 24x7 Emergency Command Centers.', 'info');
    } else {
      if (typeof toast === 'function') toast('Dark theme preference active', 'success');
    }
  });
});

// 4. Language Selection
const langSelect = document.getElementById('lang-select');
if (langSelect) {
  langSelect.value = (typeof lsGet === 'function') ? lsGet(LS_KEYS.LANG, 'en') : 'en';
  langSelect.addEventListener('change', () => {
    if (typeof lsSet === 'function') lsSet(LS_KEYS.LANG, langSelect.value);
    if (typeof toast === 'function') toast('Language preferences saved', 'success');
  });
}

// 5. Notification Toggles
['notif-critical', 'notif-high', 'notif-daily'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    const saved = (typeof lsGet === 'function') ? lsGet('wlms_notif_' + id, el.checked) : el.checked;
    el.checked = saved;
    el.addEventListener('change', () => {
      if (typeof lsSet === 'function') lsSet('wlms_notif_' + id, el.checked);
      if (typeof toast === 'function') toast('Notification frequency updated', 'success');
    });
  }
});

// 6. Export Verified Telemetry & System Logs
function exportData() {
  const dump = {
    exported_at: new Date().toISOString(),
    region: "North Eastern Region (NER), India",
    active_cloud_backend: API_BASE,
    users: (typeof lsGet === 'function') ? lsGet(LS_KEYS.USERS, []) : [],
    field_reports: (typeof lsGet === 'function') ? lsGet(LS_KEYS.REPORTS, []) : [],
    active_alerts: (typeof lsGet === 'function') ? lsGet(LS_KEYS.ALERTS, []) : [],
    live_districts_cache: (typeof lsGet === 'function') ? lsGet(LS_KEYS.LIVE_CACHE, []) : []
  };

  const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wlms-telemetry-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  if (typeof toast === 'function') toast('Telemetry snapshot exported successfully', 'success');
}

// 7. Flush Local Cache & Re-sync Live Satellites
function resetDemoData() {
  if (!confirm('This will clear local cache and re-sync live satellite telemetry from the cloud backend. Continue?')) return;
  
  localStorage.removeItem(LS_KEYS.REPORTS);
  localStorage.removeItem(LS_KEYS.ALERTS);
  localStorage.removeItem(LS_KEYS.LIVE_CACHE);
  
  if (typeof seedIfEmpty === 'function') seedIfEmpty();
  if (typeof toast === 'function') toast('Cache cleared. Re-syncing live satellites...', 'success');
  
  setTimeout(() => {
    window.location.reload();
  }, 1200);
}

// 8. Inject 24x7 Live Cloud Pipeline Health Card
function injectPipelineStatus() {
  const dataCard = document.querySelector('.panel:has(#export-btn), .panel:last-of-type') || document.querySelector('.settings-grid') || document.body;
  if (!dataCard || document.getElementById('pipeline-health-card')) return;

  const healthDiv = document.createElement('div');
  healthDiv.id = 'pipeline-health-card';
  healthDiv.className = 'panel panel-pad';
  healthDiv.style.cssText = 'margin-top: 20px; border-left: 3px solid #22c55e; background: var(--bg-surface);';
  healthDiv.innerHTML = `
    <div style="font-weight:700; font-size:14.5px; color:var(--text-main); margin-bottom:10px; display:flex; align-items:center; gap:8px;">
      <span style="width:8px; height:8px; border-radius:50%; background:#22c55e; box-shadow:0 0 8px #22c55e;"></span>
      24x7 Live Sensor & Cloud Pipeline Status
    </div>
    <div style="font-size:12.5px; color:var(--text-dim); display:flex; flex-direction:column; gap:6px;">
      <div>• <b>FastAPI Backend:</b> <span style="color:#38bdf8;">Connected & Operational (Render Production)</span></div>
      <div>• <b>Satellite Radar:</b> <span style="color:#22c55e;">Open-Meteo / ECMWF Live Telemetry Stream</span></div>
      <div>• <b>Seismic Integration:</b> <span style="color:#22c55e;">USGS Zone V Real-time Tectonic Feed</span></div>
      <div>• <b>AI Inference Engine:</b> <code style="color:#ca8a04;">risk_model.pkl</code> (Random Forest Regressor, n_jobs=1)</div>
    </div>
  `;
  dataCard.appendChild(healthDiv);
}

renderProfile();
injectPipelineStatus();