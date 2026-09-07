/* =========================================================
   emergency-priority.js — Controlled Live Priority Dispatcher
   ========================================================= */

initShell({ active: 'emergency-priority.html', title: 'Emergency Priority', crumb: 'Field Ops / Emergency Priority' });

const API_BASE = typeof BACKEND_URL !== 'undefined' ? BACKEND_URL : "https://sih-landslide-backend-kzl9.onrender.com";

function roadLabel(status){
  const s = (status || 'open').toLowerCase();
  return { open: '🟢 Open', 'at-risk': '🟠 At Risk', blocked: '🔴 Blocked' }[s] || '🟢 Open';
}

function renderPriorityList(locations){
  const ranked = [...locations].sort((a,b) => (b.riskScore || 0) - (a.riskScore || 0));
  const container = document.getElementById('priority-list');
  if (!container) return;

  container.innerHTML = ranked.map((l, i) => {
    const rm = riskMeta(l.riskLevel || 'moderate');
    const rankColor = i === 0 ? 'var(--risk-crit)' : i === 1 ? 'var(--risk-high)' : 'var(--text-dim)';
    
    return `
      <div class="priority-card">
        <div class="priority-rank" style="color:${rankColor}; border-color:${i < 2 ? rankColor : 'var(--border)'}">${i + 1}</div>
        <div>
          <div class="p-name">${l.name} <span class="badge badge-${rm.cls}" style="margin-left:8px;">${rm.label}</span></div>
          <div class="p-sub">
            <span>Risk score <b>${l.riskScore}/100</b></span>
            <span>Road status <b>${roadLabel(l.roadStatus)}</b></span>
            <span>Active alerts <b>${l.activeAlerts || 0}</b></span>
            <span>Confidence <b>${l.confidence || 88}%</b></span>
          </div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="window.location.href='risk-map.html?loc=${l.id}'">View on Map</button>
      </div>
    `;
  }).join('');
}

// Pehle demo locations dikhao
let currentRanked = [...DEMO_LOCATIONS];
renderPriorityList(currentRanked);

// Sirf top 5 districts ka live data lo (Server crash nahi hoga)
async function fetchSafePriorities() {
  const topIds = [1, 2, 3, 4, 5];
  for (const id of topIds) {
    try {
      const res = await fetch(`${API_BASE}/live-risk/${id}`);
      if (res.ok) {
        const data = await res.json();
        const score = Math.round(data.realtime_ai_risk_assessment?.risk_score ?? 50);
        const item = currentRanked.find(x => String(x.id) === String(id));
        if (item) {
          item.riskScore = score;
          item.riskLevel = (data.realtime_ai_risk_assessment?.risk_level || 'moderate').toLowerCase();
          item.roadStatus = score >= 75 ? 'blocked' : score >= 50 ? 'at-risk' : 'open';
          item.activeAlerts = score >= 75 ? 2 : score >= 50 ? 1 : 0;
        }
      }
    } catch(e) {}
  }
  renderPriorityList(currentRanked);
}

fetchSafePriorities();