/* =========================================================
   shell.js — Injects Dynamic Sidebar, Topbar & Live Clock Shell
   ========================================================= */

const LOGO_SVG = `
<svg class="logo-dot" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="20" r="19" fill="#10171E" stroke="#2dd4bf" stroke-width="1.5"/>
  <path d="M6 26L15 14L21 21L27 12L34 26" stroke="#2dd4bf" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="27" cy="12" r="2.4" fill="#ef4444"/>
</svg>`;

const NAV_ITEMS = [
  { group: 'Monitor', items: [
    { href: 'dashboard.html', label: 'Dashboard', icon: 'grid' },
    { href: 'risk-map.html', label: 'Risk Map', icon: 'map' },
    { href: 'risk-analysis.html', label: 'Risk Analysis', icon: 'activity' },
    { href: 'alerts.html', label: 'Alerts', icon: 'bell', badge: true },
  ]},
  { group: 'Field Ops', items: [
    { href: 'field-reports.html', label: 'Field Reports', icon: 'clipboard' },
    { href: 'road-monitoring.html', label: 'Road Monitoring', icon: 'road' },
    { href: 'emergency-priority.html', label: 'Emergency Priority', icon: 'siren' },
  ]},
  { group: 'Insights', items: [
    { href: 'historical-landslides.html', label: 'Historical Landslides', icon: 'clock' },
    { href: 'weather.html', label: 'Weather', icon: 'cloud' },
    { href: 'safety-information.html', label: 'Safety Information', icon: 'shield' },
  ]},
  { group: 'System', items: [
    { href: 'settings.html', label: 'Settings', icon: 'settings' },
  ]}
];

const ICONS = {
  grid: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" stroke="currentColor" stroke-width="1.6" fill="none"/>',
  map: '<path d="M9 3L3 5v16l6-2 6 2 6-2V3l-6 2-6-2z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/><path d="M9 3v16M15 5v16" stroke="currentColor" stroke-width="1.6"/>',
  activity: '<path d="M2 12h5l2-8 4 16 3-11 2 3h4" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  bell: '<path d="M18 8a6 6 0 10-12 0c0 7-3 8-3 8h18s-3-1-3-8" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.7 21a2 2 0 01-3.4 0" stroke="currentColor" stroke-width="1.6"/>',
  clipboard: '<path d="M9 3h6v3H9z" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M6 5h2v0H6a1 1 0 00-1 1v14a1 1 0 001 1h12a1 1 0 001-1V6a1 1 0 00-1-1h-2" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M8 12h8M8 16h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  road: '<path d="M9 3L4 21M15 3l5 18M12 3v3M12 10v3M12 17v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  siren: '<path d="M12 2a5 5 0 015 5v6H7V7a5 5 0 015-5z" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M5 21l1-4h12l1 4M12 2V0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  clock: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M12 7v5l3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  cloud: '<path d="M7 18a4 4 0 010-8 5 5 0 019.8-1.4A4.5 4.5 0 0118 18H7z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/>',
  shield: '<path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  settings: '<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M19 12a7 7 0 00-.2-1.6l2-1.5-2-3.5-2.4.7a7 7 0 00-2.8-1.6L13 2h-4l-.6 2.5a7 7 0 00-2.8 1.6l-2.4-.7-2 3.5 2 1.5A7 7 0 003 12c0 .5.05 1 .2 1.6l-2 1.5 2 3.5 2.4-.7a7 7 0 002.8 1.6L9 22h4l.6-2.5a7 7 0 002.8-1.6l2.4.7 2-3.5-2-1.5c.15-.5.2-1 .2-1.6z" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linejoin="round"/>'
};

function getActiveAlertsCount() {
  if (typeof lsGet !== 'function') return 0;
  const alerts = lsGet(LS_KEYS.ALERTS, []);
  if (!Array.isArray(alerts)) return 0;
  return alerts.filter(a => a.status === 'active' || !a.status).length;
}

function buildSidebar(activeHref) {
  const session = typeof currentSession === 'function' ? currentSession() : null;
  const name = session ? session.name : 'Demo Officer';
  const role = session ? session.role : 'Field Coordinator';
  const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  const alertCount = getActiveAlertsCount();

  let groupsHtml = '';
  NAV_ITEMS.forEach(g => {
    groupsHtml += `<div class="nav-group"><div class="grp-label">${g.group}</div>`;
    g.items.forEach(it => {
      const active = it.href === activeHref ? ' active' : '';
      const badge = (it.badge && alertCount > 0) ? `<span class="badge-count" data-shell-alert-badge>${alertCount}</span>` : '';
      groupsHtml += `<a class="nav-link${active}" href="${it.href}">
        <svg viewBox="0 0 24 24">${ICONS[it.icon]}</svg><span>${it.label}</span>${badge}
      </a>`;
    });
    groupsHtml += `</div>`;
  });

  return `
    <div class="brand">
      ${LOGO_SVG}
      <div class="name">WLMS <small>Landslide Monitoring</small></div>
    </div>
    <nav>${groupsHtml}</nav>
    <div class="sidebar-foot">
      <div class="user-chip">
        <div class="avatar">${initials}</div>
        <div class="uinfo">
          <div class="uname">${name}</div>
          <div class="urole">${role}</div>
        </div>
      </div>
      <a class="logout-link" href="#" onclick="if(typeof logout==='function')logout(); else window.location.href='index.html'; return false;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Sign out
      </a>
    </div>
  `;
}

function buildTopbar(title, crumb) {
  const alertCount = getActiveAlertsCount();

  return `
    <button class="menu-btn" onclick="document.querySelector('.sidebar').classList.toggle('open')">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </button>
    <div>
      <h1>${title}</h1>
      <div class="crumb">${crumb || 'Warning and Landslide Monitoring System'}</div>
    </div>
    <div class="spacer"></div>
    
    <!-- 24x7 Live Radar Pulse Indicator -->
    <div class="live-indicator-pill" style="display:flex; align-items:center; gap:6px; font-size:12px; font-weight:600; color:#22c55e; background:rgba(34,197,94,0.08); padding:5px 12px; border-radius:20px; border:1px solid rgba(34,197,94,0.25); margin-right:12px;">
      <span style="width:7px; height:7px; border-radius:50%; background:#22c55e; box-shadow:0 0 8px #22c55e; display:inline-block;"></span>
      <span>24x7 Live Radar</span>
    </div>

    <!-- Live Ticking Clock -->
    <div class="clock" id="live-clock" style="font-family:monospace; font-weight:600; font-size:13px; color:var(--text-dim); margin-right:12px;">--:--:--</div>

    <!-- Notification Bell with Dynamic Live Badge -->
    <a class="bell" href="alerts.html" title="Active alerts" style="position:relative;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 8a6 6 0 10-12 0c0 7-3 8-3 8h18s-3-1-3-8" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.7 21a2 2 0 01-3.4 0" stroke="currentColor" stroke-width="1.6"/></svg>
      <span class="dot" id="topbar-bell-badge" style="display:${alertCount > 0 ? 'flex' : 'none'};">${alertCount}</span>
    </a>
  `;
}

// ---------------- DYNAMIC BADGE SYNCHRONIZER ----------------
function updateShellAlertBadges() {
  const count = getActiveAlertsCount();
  
  // Topbar Bell Badge
  const bellBadge = document.getElementById('topbar-bell-badge');
  if (bellBadge) {
    bellBadge.textContent = count;
    bellBadge.style.display = count > 0 ? 'flex' : 'none';
  }

  // Sidebar Nav Badge
  const sidebarBadges = document.querySelectorAll('[data-shell-alert-badge]');
  sidebarBadges.forEach(b => {
    b.textContent = count;
    b.style.display = count > 0 ? 'inline-flex' : 'none';
  });
}

function initShell({ active, title, crumb }) {
  if (typeof requireAuth === 'function') requireAuth();

  const sbMount = document.getElementById('sidebar-mount');
  if (sbMount) sbMount.innerHTML = buildSidebar(active);

  const tbMount = document.getElementById('topbar-mount');
  if (tbMount) tbMount.innerHTML = buildTopbar(title, crumb);

  tickClock();
  setInterval(tickClock, 1000);

  // Sync badges every 3 seconds to reflect live alerts
  updateShellAlertBadges();
  setInterval(updateShellAlertBadges, 3000);
}

function tickClock() {
  const el = document.getElementById('live-clock');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleString('en-IN', { 
    weekday: 'short', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: true 
  });
}

function toast(msg, type) {
  let root = document.getElementById('toast-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'toast-root';
    document.body.appendChild(root);
  }
  const t = document.createElement('div');
  t.className = 'toast' + (type ? ' ' + type : '');
  t.textContent = msg;
  root.appendChild(t);
  setTimeout(() => { 
    t.style.opacity = '0'; 
    t.style.transition = 'opacity .3s'; 
    setTimeout(() => t.remove(), 300); 
  }, 3600);
}