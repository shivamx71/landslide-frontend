/* =========================================================
   alerts.js — Live Alerts Engine & SMS Gateway
   ========================================================= */

initShell({ active: 'alerts.html', title: 'Alerts', crumb: 'Monitor / Alerts' });

const API_BASE = typeof BACKEND_URL !== 'undefined' ? BACKEND_URL : "http://127.0.0.1:8000";

let currentFilter = 'all';
let liveAlertsList = [];

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

function formatAlertTime(dateStr) {
  if (!dateStr) return 'Just now';
  return dateStr;
}

// ---------------- RENDER ALERTS UI ----------------
function renderAlerts() {
  // Pull from memory or direct LocalStorage cache
  if (liveAlertsList.length === 0 && typeof lsGet === 'function') {
    liveAlertsList = lsGet(LS_KEYS.ALERTS, []);
  }

  const all = [...liveAlertsList].sort((a, b) => (b.riskScore || b.risk_score || 0) - (a.riskScore || a.risk_score || 0));

  const critEl = document.getElementById('cnt-critical');
  const highEl = document.getElementById('cnt-high');
  const modEl = document.getElementById('cnt-mod');

  if (critEl) critEl.textContent = all.filter(a => normalizeSeverity(a.severity) === 'critical').length;
  if (highEl) highEl.textContent = all.filter(a => normalizeSeverity(a.severity) === 'high').length;
  if (modEl) modEl.textContent = all.filter(a => normalizeSeverity(a.severity) === 'moderate').length;

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
      <div class="panel" style="padding: 24px; text-align: center;">
        <div class="empty-state">
          <div class="ic" style="font-size: 32px;">🛰️</div>
          <div style="font-weight:600; font-size:15px; margin-top:8px;">Syncing 24x7 Satellite Telemetry...</div>
          <div style="font-size:12.5px; color:var(--text-faint); margin-top:4px;">Scanning 46 North-East districts for slope instability.</div>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map((a, idx) => {
    const acked = a.status === 'acknowledged';
    const normSev = normalizeSeverity(a.severity);
    const score = a.riskScore || a.risk_score || 70;
    const rain = a.rainfall24h || a.rainfall_24h || 120;
    const soil = a.soilMoisture || a.soil_moisture || 65;
    const color = a.color || (normSev === 'critical' ? '#dc2626' : (normSev === 'high' ? '#ea580c' : '#ca8a04'));
    const title = a.title || `${normSev.toUpperCase()} LANDSLIDE WARNING`;

    return `
      <div class="alert-card sev-${normSev} ${acked ? 'acknowledged' : ''}" style="background: #1e293b; border-left: 5px solid ${color}; border-radius: 8px; padding: 16px; margin-bottom: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
        <div style="display: flex; gap: 14px; align-items: flex-start;">
          <div style="font-size: 26px; line-height: 1;">${severityIcon(normSev)}</div>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 700; font-size: 15px; color: #f8fafc;">${title}</span>
              <span class="badge" style="background: ${color}; color: #fff; padding: 3px 10px; border-radius: 4px; font-weight: 700; font-size: 11px;">${normSev.toUpperCase()}</span>
            </div>

            <div style="margin-top: 6px; font-size: 12.5px; color: #94a3b8;">
              <b style="color: #f1f5f9;">${a.location}</b> · Risk Index: <b style="color: ${color}; font-size: 14px;">${score}/100</b> · 24h Rain: <b>${rain}mm</b> · Soil: <b>${soil}%</b>
            </div>

            <p style="margin: 8px 0; font-size: 13px; color: #cbd5e1; line-height: 1.4;">${a.message}</p>

            ${a.action_advisory || a.actionAdvisory ? `
              <div style="background: rgba(56, 189, 248, 0.08); border: 1px dashed #0284c7; padding: 8px 12px; border-radius: 6px; margin: 8px 0; font-size: 12px; color: #38bdf8;">
                <b>🚨 Action Directive:</b> ${a.action_advisory || a.actionAdvisory}
              </div>
            ` : ''}

            <div style="margin-top: 10px; display: flex; gap: 8px;">
              <button class="btn btn-ghost btn-sm" onclick="window.location.href='risk-map.html'">📍 View on GIS Map</button>
              ${!acked ? `<button class="btn btn-outline btn-sm" onclick="acknowledgeAlert('${a.id || idx}')">Acknowledge</button>` : ''}
              <button class="btn btn-danger btn-sm" onclick="dismissAlert('${a.id || idx}')">Dismiss</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ---------------- FETCH ALERTS FROM BACKEND ----------------
async function fetchLiveBackendAlerts() {
  try {
    const res = await fetch(`${API_BASE}/alerts`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        liveAlertsList = data;
        if (typeof lsSet === 'function') lsSet(LS_KEYS.ALERTS, liveAlertsList);
        renderAlerts();
      }
    }
  } catch (e) {
    console.warn("Backend fetch fallback to cache:", e);
    renderAlerts();
  }
}

// ---------------- SMS MODAL & REAL GATEWAY CONTROLLER ----------------
let currentSmsPhone = "";

window.openSmsModal = function() {
  document.getElementById('sms-modal').style.display = 'flex';
  resetSmsModal();
};

window.closeSmsModal = function() {
  document.getElementById('sms-modal').style.display = 'none';
};

window.resetSmsModal = function() {
  document.getElementById('sms-step-phone').style.display = 'block';
  document.getElementById('sms-step-otp').style.display = 'none';
  document.getElementById('sms-step-success').style.display = 'none';
  document.getElementById('sms-input-otp').value = "";
};

window.requestSmsOtp = async function() {
  const phone = document.getElementById('sms-input-phone').value.trim();
  if (phone.length !== 10 || isNaN(phone)) {
    alert('Kripya 10-digit ka valid mobile number dalein.');
    return;
  }

  currentSmsPhone = phone;

  try {
    const res = await fetch(`${API_BASE}/alerts/sms/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phone })
    });

    const data = await res.json();
    if (res.ok) {
      document.getElementById('sms-step-phone').style.display = 'none';
      document.getElementById('sms-step-otp').style.display = 'block';
      
      const hint = document.getElementById('sms-otp-hint');
      if (data.gateway_status === "REAL_SMS_SENT") {
        hint.innerHTML = `✅ <b>Real SMS Sent!</b> Check your mobile phone (+91-${phone}) for OTP.`;
      } else {
        hint.innerHTML = `OTP dispatched to +91-${phone}. <br><b>Demo / Testing OTP: ${data.demo_otp}</b> (Free Gateway mode)`;
      }
    } else {
      alert(data.detail || 'Could not send OTP');
    }
  } catch (e) {
    alert("Backend SMS service is offline. Make sure backend is running.");
  }
};

window.verifySmsOtp = async function() {
  const otp = document.getElementById('sms-input-otp').value.trim();
  if (otp.length !== 6) {
    alert('Kripya 6-digit OTP enter karein.');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/alerts/sms/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: currentSmsPhone, otp: otp })
    });

    const data = await res.json();
    if (res.ok) {
      document.getElementById('sms-step-otp').style.display = 'none';
      document.getElementById('sms-step-success').style.display = 'block';
      document.getElementById('sms-success-msg').innerHTML = `<b>+91-${currentSmsPhone}</b> is now successfully registered for automated RED & AMBER Landslide Emergency Alerts!`;
    } else {
      alert(data.detail || 'Invalid OTP');
    }
  } catch (e) {
    alert("Could not verify OTP. Please try again.");
  }
};

window.acknowledgeAlert = function(id) {
  const a = liveAlertsList.find((x, i) => x.id === id || String(i) === String(id));
  if (a) a.status = 'acknowledged';
  renderAlerts();
};

window.dismissAlert = function(id) {
  const a = liveAlertsList.find((x, i) => x.id === id || String(i) === String(id));
  if (a) a.status = 'dismissed';
  renderAlerts();
};

document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.filter || 'all';
    renderAlerts();
  });
});

// Run Initial Render & Auto-sync
renderAlerts();
fetchLiveBackendAlerts();
setInterval(renderAlerts, 2000); // Checks for fresh cache every 2 sec