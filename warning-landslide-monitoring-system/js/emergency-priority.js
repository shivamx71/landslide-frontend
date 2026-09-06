/* =========================================================
   emergency-priority.js
   ========================================================= */

initShell({ active: 'emergency-priority.html', title: 'Emergency Priority', crumb: 'Field Ops / Emergency Priority' });

function roadLabel(status){
  return { open: '🟢 Open', 'at-risk': '🟠 At Risk', blocked: '🔴 Blocked' }[status];
}

function render(){
  const ranked = [...DEMO_LOCATIONS].sort((a,b) => b.riskScore - a.riskScore);
  document.getElementById('priority-list').innerHTML = ranked.map((l, i) => {
    const rm = riskMeta(l.riskLevel);
    const rankColor = i===0 ? 'var(--risk-crit)' : i===1 ? 'var(--risk-high)' : 'var(--text-dim)';
    return `
      <div class="priority-card">
        <div class="priority-rank" style="color:${rankColor}; border-color:${i<2?rankColor:'var(--border)'}">${i+1}</div>
        <div>
          <div class="p-name">${l.name} <span class="badge badge-${rm.cls}" style="margin-left:8px;">${rm.label}</span></div>
          <div class="p-sub">
            <span>Risk score <b>${l.riskScore}/100</b></span>
            <span>Road status <b>${roadLabel(l.roadStatus)}</b></span>
            <span>Active alerts <b>${l.activeAlerts}</b></span>
            <span>Confidence <b>${l.confidence}%</b></span>
          </div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="window.location.href='risk-map.html'">View on Map</button>
      </div>
    `;
  }).join('');
}

render();
