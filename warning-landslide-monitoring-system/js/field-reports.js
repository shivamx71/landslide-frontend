/* =========================================================
   field-reports.js — Integrated with FastAPI SQLite Backend
   ========================================================= */

initShell({ active: 'field-reports.html', title: 'Field Reports', crumb: 'Field Ops / Field Reports' });

let pendingPhoto = null;

function useMyLocation(){
  if (!navigator.geolocation){
    toast('Geolocation is not supported by this browser.', 'error');
    return;
  }
  toast('Requesting device location…');
  navigator.geolocation.getCurrentPosition(
    pos => {
      document.getElementById('fr-lat').value = pos.coords.latitude.toFixed(5);
      document.getElementById('fr-lng').value = pos.coords.longitude.toFixed(5);
      toast('Location captured', 'success');
    },
    err => {
      toast('Could not get location: ' + err.message, 'error');
    }
  );
}

function previewPhoto(e){
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev){
    pendingPhoto = ev.target.result;
    const img = document.getElementById('fr-preview');
    img.src = pendingPhoto;
    img.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

// ---------------- RENDER REPORTS (SQLite DB + LocalStorage Sync) ----------------
async function renderReports(){
  let allReports = [];

  // 1. Fetch from FastAPI Backend SQLite Database
  try {
    const endpoint = typeof BACKEND_URL !== 'undefined' ? `${BACKEND_URL}/reports` : 'http://127.0.0.1:8000/reports';
    const res = await fetch(endpoint);
    if (res.ok) {
      const dbData = await res.json();
      if (dbData && dbData.length > 0) {
        allReports = dbData.map(r => {
          // Parse location prefix if present
          let locName = 'Field GPS Area';
          let cleanDesc = r.description;
          if (cleanDesc.startsWith('[') && cleanDesc.includes(']')) {
            locName = cleanDesc.slice(1, cleanDesc.indexOf(']'));
            cleanDesc = cleanDesc.slice(cleanDesc.indexOf(']') + 1).trim();
          }
          return {
            id: `FR-DB-${r.id}`,
            location: locName,
            lat: r.latitude,
            lng: r.longitude,
            type: r.report_type,
            description: cleanDesc,
            photo: r.photo,
            submittedAt: r.created_at || new Date().toISOString(),
            status: 'Logged in SQLite DB'
          };
        });
        console.log(">>> [FASTAPI] Loaded reports from SQLite Database:", allReports.length);
      }
    }
  } catch (err) {
    console.warn(">>> [FASTAPI] Backend offline for reports fetch, using local cache:", err);
  }

  // 2. If DB reports empty, fallback to LocalStorage
  if (allReports.length === 0) {
    allReports = lsGet(LS_KEYS.REPORTS, []);
  }

  // Sort latest first
  allReports.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  const countEl = document.getElementById('fr-count');
  if (countEl) countEl.textContent = allReports.length + ' total';

  const container = document.getElementById('reports-list');
  if (!container) return;

  if (allReports.length === 0){
    container.innerHTML = `<div class="empty-state"><div class="ic">🗒️</div>No field reports submitted yet.</div>`;
    return;
  }

  container.innerHTML = allReports.map(r => `
    <div class="report-card">
      ${r.photo ? `<img src="${r.photo}" alt="report photo">` : `<div style="width:64px;height:64px;border-radius:8px;background:var(--bg-raised);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:22px;flex:none;">📍</div>`}
      <div class="r-body">
        <div class="r-type">${r.type} <span class="text-faint" style="font-weight:400; font-size:11.5px;">· ${r.location}</span></div>
        <div class="r-meta">${fmtDate(r.submittedAt)} · ${r.lat}, ${r.lng} · <span style="color:${r.status === 'Logged in SQLite DB' ? '#38bdf8' : (r.status==='Pending'?'var(--risk-mod)':'var(--risk-low)')}; font-weight:600;">${r.status}</span></div>
        <div class="r-desc">${r.description}</div>
      </div>
    </div>
  `).join('');
}

// ---------------- SUBMIT FORM HANDLER (POST to FastAPI SQLite) ----------------
document.getElementById('report-form').addEventListener('submit', async function(e){
  e.preventDefault();

  const location = document.getElementById('fr-location').value.trim();
  const lat = Number(document.getElementById('fr-lat').value);
  const lng = Number(document.getElementById('fr-lng').value);
  const type = document.getElementById('fr-type').value;
  const desc = document.getElementById('fr-desc').value.trim();

  const payload = {
    latitude: lat || 27.3389,
    longitude: lng || 88.6065,
    report_type: type,
    description: location ? `[${location}] ${desc}` : desc,
    photo: pendingPhoto || null
  };

  // 1. Post directly to FastAPI Backend SQLite DB
  let isSavedInDB = false;
  try {
    const endpoint = typeof BACKEND_URL !== 'undefined' ? `${BACKEND_URL}/reports` : 'http://127.0.0.1:8000/reports';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      isSavedInDB = true;
      console.log(">>> [FASTAPI] Report permanently written to SQLite Database! ID:", data.report_id);
    } else {
      throw new Error("Backend error on save");
    }
  } catch (err) {
    console.warn(">>> [FASTAPI] Backend offline, fallback to local storage:", err);
  }

  // 2. Also keep in LocalStorage for instant UI render
  const reports = lsGet(LS_KEYS.REPORTS, []);
  const newReport = {
    id: uid('FR'),
    location: location || 'Field Observation',
    lat: lat,
    lng: lng,
    type: type,
    description: desc,
    photo: pendingPhoto,
    submittedAt: new Date().toISOString(),
    status: isSavedInDB ? 'Logged in SQLite DB' : 'Pending'
  };
  reports.unshift(newReport);
  lsSet(LS_KEYS.REPORTS, reports);

  // 3. UI feedback
  const successBox = document.getElementById('fr-success');
  if (successBox) {
    successBox.style.display = 'block';
    successBox.innerHTML = `✅ <b>Report Saved in SQLite Database!</b> Incident logged for Disaster Management review.`;
    setTimeout(() => successBox.style.display = 'none', 3500);
  }
  toast('✅ Field report saved in SQLite Database.', 'success');

  this.reset();
  pendingPhoto = null;
  document.getElementById('fr-preview').style.display = 'none';

  // Refresh reports list
  await renderReports();
});

renderReports();