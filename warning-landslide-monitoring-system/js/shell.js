/* =========================================================
   shell.js — injects sidebar + topbar app shell on every
   internal page, and provides shared UI utilities (toasts).
   ========================================================= */

const LOGO_SVG = `
<svg class="logo-dot" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="20" r="19" fill="#10171E" stroke="#2FB8A6" stroke-width="1.4"/>
  <path d="M6 26L15 14L21 21L27 12L34 26" stroke="#2FB8A6" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="27" cy="12" r="2.4" fill="#FF5252"/>
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

function buildSidebar(activeHref){
  const session = currentSession();
  const initials = session ? session.name.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase() : 'DU';
  let groupsHtml = '';
  NAV_ITEMS.forEach(g => {
    groupsHtml += `<div class="nav-group"><div class="grp-label">${g.group}</div>`;
    g.items.forEach(it => {
      const active = it.href === activeHref ? ' active' : '';
      const alerts = lsGet(LS_KEYS.ALERTS, []).filter(a=>a.status==='active').length;
      const badge = (it.badge && alerts > 0) ? `<span class="badge-count">${alerts}</span>` : '';
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
          <div class="uname">${session ? session.name : 'Demo User'}</div>
          <div class="urole">${session ? session.role : 'Guest'}</div>
        </div>
      </div>
      <a class="logout-link" href="#" onclick="logout();return false;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Sign out
      </a>
    </div>
  `;
}

function buildTopbar(title, crumb){
  const alerts = lsGet(LS_KEYS.ALERTS, []).filter(a=>a.status==='active').length;
  return `
    <button class="menu-btn" onclick="document.querySelector('.sidebar').classList.toggle('open')">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </button>
    <div>
      <h1>${title}</h1>
      <div class="crumb">${crumb || 'Warning and Landslide Monitoring System'}</div>
    </div>
    <div class="spacer"></div>
    <div class="clock" id="live-clock">--:--:--</div>
    <a class="bell" href="alerts.html" title="Active alerts">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M18 8a6 6 0 10-12 0c0 7-3 8-3 8h18s-3-1-3-8" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.7 21a2 2 0 01-3.4 0" stroke="currentColor" stroke-width="1.6"/></svg>
      ${alerts > 0 ? `<span class="dot">${alerts}</span>` : ''}
    </a>
  `;
}

function initShell({ active, title, crumb }){
  requireAuth();
  document.getElementById('sidebar-mount').innerHTML = buildSidebar(active);
  document.getElementById('topbar-mount').innerHTML = buildTopbar(title, crumb);
  tickClock();
  setInterval(tickClock, 1000);
}

function tickClock(){
  const el = document.getElementById('live-clock');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleString(undefined, { weekday:'short', hour:'2-digit', minute:'2-digit', second:'2-digit' });
}

function toast(msg, type){
  let root = document.getElementById('toast-root');
  if (!root){
    root = document.createElement('div');
    root.id = 'toast-root';
    document.body.appendChild(root);
  }
  const t = document.createElement('div');
  t.className = 'toast' + (type ? ' ' + type : '');
  t.textContent = msg;
  root.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(()=>t.remove(), 300); }, 3600);
}
