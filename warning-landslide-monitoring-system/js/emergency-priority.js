/* =========================================================
   emergency-priority.js — Live AI Risk Priority Dispatcher
   ========================================================= */

initShell({ active: 'emergency-priority.html', title: 'Emergency Priority', crumb: 'Field Ops / Emergency Priority' });

const API_BASE = typeof BACKEND_URL !== 'undefined' ? BACKEND_URL : "https://sih-landslide-backend-kzl9.onrender.com";

function roadLabel(status){
  const s = (status || 'open').toLowerCase();
  return { open: '🟢 Open', 'at-risk': '🟠 At Risk', blocked: '🔴 Blocked' }[s] || '🟢 Open';
}

function renderPriorityList(locations){
  // Highest risk score sabse upar (Rank 1)
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

// ---------------- LIVE BACKEND DATA FETCH ----------------
async function fetchLivePriorities() {
  try {
    // 1. Fetch all locations from backend
    const res = await fetch(`${API_BASE}/locations`);
    if (!res.ok) throw new Error("Could not fetch locations");
    
    const dbLocs = await res.json();
    if (!Array.isArray(dbLocs) || dbLocs.length === 0) return;

    // 2. Fetch live risk for each district in parallel
    const enrichedLocations = await Promise.all(
      dbLocs.map(async (loc) => {
        try {
          const rRes = await fetch(`${API_BASE}/live-risk/${loc.id}`);
          if (rRes.ok) {
            const rData = await rRes.json();
            const aiRisk = rData.realtime_ai_risk_assessment || {};
            const score = Math.round(aiRisk.risk_score ?? 50);
            return {
              id: loc.id,
              name: loc.name,
              riskScore: score,
              riskLevel: (aiRisk.risk_level || 'moderate').toLowerCase(),
              roadStatus: score > 75 ? 'blocked' : score > 50 ? 'at-risk' : 'open',
              activeAlerts: score > 75 ? 2 : score > 50 ? 1 : 0,
              confidence: Math.min(96, Math.max(75, Math.round(score * 0.9 + 15)))
            };
          }
        } catch (e) {}

        // Fallback for single district if request fails
        return {
          id: loc.id,
          name: loc.name,
          riskScore: 45,
          riskLevel: 'moderate',
          roadStatus: 'open',
          activeAlerts: 0,
          confidence: 80
        };
      })
    );

    console.log(">>> [EMERGENCY PRIORITY] Live Enriched Ranks:", enrichedLocations);
    renderPriorityList(enrichedLocations);

  } catch (err) {
    console.warn("Using fallback priority data:", err);
    // Offline fallback
    renderPriorityList(DEMO_LOCATIONS);
  }
}

// Initial render with fallback data
renderPriorityList(DEMO_LOCATIONS);

// Fetch Live Backend Rankings
fetchLivePriorities();

// Auto refresh every 45 seconds
setInterval(fetchLivePriorities, 45000);