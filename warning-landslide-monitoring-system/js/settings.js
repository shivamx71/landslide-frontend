/* =========================================================
   settings.js
   ========================================================= */

initShell({ active: 'settings.html', title: 'Settings', crumb: 'System / Settings' });

function renderProfile(){
  const s = currentSession();
  document.getElementById('profile-block').innerHTML = `
    <div class="field"><label>Name</label><input type="text" value="${s.name}" disabled></div>
    <div class="field"><label>Email</label><input type="text" value="${s.email}" disabled></div>
    <div class="field-row">
      <div class="field"><label>Organisation</label><input type="text" value="${s.org || '—'}" disabled></div>
      <div class="field"><label>Role</label><input type="text" value="${s.role || '—'}" disabled></div>
    </div>
    <p class="text-faint" style="font-size:11.5px; margin-top:6px;">Profile fields are read-only in this demo build.</p>
  `;
}

document.querySelectorAll('.theme-swatch button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.theme-swatch button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    lsSet(LS_KEYS.THEME, btn.dataset.theme);
    if (btn.dataset.theme === 'light'){
      toast('Light theme is a preview only in this demo — dark mode remains active.', 'warn');
    } else {
      toast('Theme preference saved', 'success');
    }
  });
});

const langSelect = document.getElementById('lang-select');
langSelect.value = lsGet(LS_KEYS.LANG, 'en');
langSelect.addEventListener('change', () => {
  lsSet(LS_KEYS.LANG, langSelect.value);
  toast('Language preference saved (labels remain in English for this demo)', 'success');
});

['notif-critical','notif-high','notif-daily'].forEach(id => {
  const el = document.getElementById(id);
  const saved = lsGet('wlms_notif_' + id, el.checked);
  el.checked = saved;
  el.addEventListener('change', () => {
    lsSet('wlms_notif_' + id, el.checked);
    toast('Preference saved', 'success');
  });
});

function exportData(){
  const dump = {
    users: lsGet(LS_KEYS.USERS, []),
    reports: lsGet(LS_KEYS.REPORTS, []),
    alerts: lsGet(LS_KEYS.ALERTS, []),
    analyses: lsGet(LS_KEYS.ANALYSES, [])
  };
  const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'wlms-demo-data.json'; a.click();
  URL.revokeObjectURL(url);
  toast('Data exported', 'success');
}

function resetDemoData(){
  if (!confirm('This will clear field reports, alerts and analyses generated during this demo session. Continue?')) return;
  localStorage.removeItem(LS_KEYS.REPORTS);
  localStorage.removeItem(LS_KEYS.ALERTS);
  localStorage.removeItem(LS_KEYS.ANALYSES);
  seedIfEmpty();
  toast('Demo data reset', 'success');
}

renderProfile();
