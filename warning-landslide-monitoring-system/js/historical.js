/* =========================================================
   historical.js — ISRO NRSC & GSI Historical Landslide Analytics
   ========================================================= */

initShell({ active: 'historical-landslides.html', title: 'Historical Landslides', crumb: 'Insights / Historical Landslides' });

// Comprehensive Geological & Meteorological Historical Dataset
const HISTORICAL_RECORDS = typeof HISTORICAL_LANDSLIDES !== 'undefined' ? HISTORICAL_LANDSLIDES : [
  { year: 2024, location: 'East Sikkim', severity: 'Critical', deaths: 6, roadsBlocked: 3, cause: 'Monsoon Flash Influx' },
  { year: 2023, location: 'East Sikkim', severity: 'Critical', deaths: 14, roadsBlocked: 4, cause: 'Teesta Basin Flash Flood' },
  { year: 2023, location: 'Aizawl',      severity: 'High',     deaths: 4, roadsBlocked: 2, cause: 'Continuous Slope Saturation' },
  { year: 2022, location: 'Churachandpur', severity: 'Critical', deaths: 58, roadsBlocked: 5, cause: 'Tupul Railway Cut Slope Failure' },
  { year: 2022, location: 'Kohima',      severity: 'Moderate', deaths: 2, roadsBlocked: 2, cause: 'NH-29 Sinking Zone' },
  { year: 2021, location: 'Shillong',    severity: 'Moderate', deaths: 1, roadsBlocked: 1, cause: 'Excess Precipitation Seepage' },
  { year: 2020, location: 'East Sikkim', severity: 'High',     deaths: 5, roadsBlocked: 3, cause: 'Pore Pressure Rupture' },
  { year: 2019, location: 'Aizawl',      severity: 'Moderate', deaths: 2, roadsBlocked: 2, cause: 'Unregulated Cut Slope Runoff' },
  { year: 2018, location: 'Kohima',      severity: 'High',     deaths: 7, roadsBlocked: 4, cause: 'Seismic Disturbance + Monsoon' }
];

function groupCount(arr, key) {
  const map = {};
  arr.forEach(x => { 
    const val = x[key] || 'Unknown';
    map[val] = (map[val] || 0) + 1; 
  });
  return map;
}

// ---------------- 1. HIGH-DPI SHARP BAR CHART RENDERER ----------------
function barChart(canvasId, labels, values, colors) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 280;
  const h = canvas.height || 180;

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const max = Math.max(...values, 1);
  const padL = 30, padB = 26, padT = 16;
  const totalSlots = values.length || 1;
  const gap = (w - padL - 10) / totalSlots;
  const barW = Math.min(gap * 0.55, 36);

  // Baseline Axis
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padL, h - padB);
  ctx.lineTo(w - 10, h - padB);
  ctx.stroke();

  values.forEach((v, i) => {
    const barH = (v / max) * (h - padT - padB);
    const x = padL + i * gap + (gap - barW) / 2;
    const y = h - padB - barH;

    const fillClr = Array.isArray(colors) ? colors[i] : colors;

    // Draw Bar with subtle rounded corners
    ctx.fillStyle = fillClr;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
    } else {
      ctx.rect(x, y, barW, barH);
    }
    ctx.fill();

    // Value Label on Top of Bar
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(v, x + barW / 2, y - 6);

    // Bottom Axis Category Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 10.5px Inter, sans-serif';
    ctx.fillText(labels[i], x + barW / 2, h - 8);
  });
}

// ---------------- 2. RENDER HISTORICAL INSIGHTS & METRICS ----------------
function renderHistoricalInsights(dataset) {
  const totalIncidents = dataset.length;
  const totalDeaths = dataset.reduce((sum, d) => sum + (Number(d.deaths) || 0), 0);
  const totalRoads = dataset.reduce((sum, d) => sum + (Number(d.roadsBlocked) || 0), 0);

  // Header Summary Count
  const countEl = document.getElementById('hist-count');
  if (countEl) {
    countEl.innerHTML = `<b>${totalIncidents}</b> incidents recorded · <b>${totalDeaths}</b> casualties · <b>${totalRoads}</b> highway blockages documented`;
  }

  // Chart 1: Incidents Grouped by Year
  const byYear = groupCount(dataset, 'year');
  const years = Object.keys(byYear).sort();
  barChart('chart-year', years, years.map(y => byYear[y]), '#38bdf8');

  // Chart 2: Incidents Grouped by Severity
  const bySev = groupCount(dataset, 'severity');
  const sevOrder = ['Low', 'Moderate', 'High', 'Critical'];
  const sevColors = { 
    Low: '#16a34a', 
    Moderate: '#ca8a04', 
    High: '#ea580c', 
    Critical: '#dc2626' 
  };
  const sevLabels = sevOrder.filter(s => bySev[s]);
  barChart('chart-severity', sevLabels, sevLabels.map(s => bySev[s]), sevLabels.map(s => sevColors[s]));

  // Location Vulnerability Progress Bars
  const byLoc = groupCount(dataset, 'location');
  const maxLoc = Math.max(...Object.values(byLoc), 1);
  const locBarsEl = document.getElementById('loc-bars');
  
  if (locBarsEl) {
    locBarsEl.innerHTML = Object.entries(byLoc)
      .sort((a, b) => b[1] - a[1])
      .map(([loc, count]) => {
        const pct = Math.round((count / maxLoc) * 100);
        return `
          <div class="bar-row" style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
            <div class="b-label" style="width:110px; font-size:12.5px; font-weight:600; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${loc}
            </div>
            <div class="bar-track" style="flex:1; height:8px; background:var(--bg-raised); border-radius:4px; overflow:hidden;">
              <div class="bar-fill" style="width:${pct}%; height:100%; background:#2dd4bf; border-radius:4px; transition: width 0.6s ease;"></div>
            </div>
            <div class="b-pct" style="width:30px; font-size:12px; font-family:monospace; text-align:right; color:var(--text-faint);">
              ${count}
            </div>
          </div>
        `;
      }).join('');
  }

  // Table Body Rendering
  const tbody = document.getElementById('hist-table-body');
  if (tbody) {
    const badgeMap = {
      Low:      { cls: 'low',  color: '#16a34a' },
      Moderate: { cls: 'mod',  color: '#ca8a04' },
      High:     { cls: 'high', color: '#ea580c' },
      Critical: { cls: 'crit', color: '#dc2626' }
    };

    tbody.innerHTML = [...dataset]
      .sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0))
      .map(h => {
        const b = badgeMap[h.severity] || badgeMap.Moderate;
        return `
          <tr>
            <td class="mono" style="font-weight:700; color:#38bdf8;">${h.year}</td>
            <td style="font-weight:600;">${h.location}</td>
            <td>
              <span class="badge badge-${b.cls}" style="border: 1px solid ${b.color};">
                ${h.severity}
              </span>
            </td>
            <td class="mono" style="color:${h.deaths > 5 ? '#dc2626' : 'inherit'}; font-weight:600;">${h.deaths}</td>
            <td class="mono">${h.roadsBlocked}</td>
          </tr>
        `;
      }).join('');
  }
}

// Initial Execution
renderHistoricalInsights(HISTORICAL_RECORDS);

// Window resize handler for crisp canvas charts
window.addEventListener('resize', () => {
  renderHistoricalInsights(HISTORICAL_RECORDS);
});