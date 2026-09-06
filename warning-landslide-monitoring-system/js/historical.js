/* =========================================================
   historical.js
   ========================================================= */

initShell({ active: 'historical-landslides.html', title: 'Historical Landslides', crumb: 'Insights / Historical Landslides' });

function groupCount(arr, key){
  const map = {};
  arr.forEach(x => { map[x[key]] = (map[x[key]] || 0) + 1; });
  return map;
}

function barChart(canvasId, labels, values, colors){
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.height;
  canvas.width = w*dpr; canvas.height = h*dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0,0,w,h);
  const max = Math.max(...values, 1);
  const padL = 26, padB = 26, padT = 14;
  const gap = (w - padL - 10) / values.length;
  const barW = gap * 0.55;
  ctx.strokeStyle = '#223040';
  ctx.beginPath(); ctx.moveTo(padL, h-padB); ctx.lineTo(w-5, h-padB); ctx.stroke();
  values.forEach((v,i) => {
    const barH = (v/max) * (h - padT - padB);
    const x = padL + i*gap + (gap-barW)/2;
    const y = h - padB - barH;
    ctx.fillStyle = Array.isArray(colors) ? colors[i] : colors;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x,y,barW,barH,5); else ctx.rect(x,y,barW,barH);
    ctx.fill();
    ctx.fillStyle = '#93A6B5';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(v, x+barW/2, y-6);
    ctx.fillStyle = '#647588';
    ctx.fillText(labels[i], x+barW/2, h-8);
  });
}

function render(){
  document.getElementById('hist-count').textContent = HISTORICAL_LANDSLIDES.length + ' incidents recorded';

  const byYear = groupCount(HISTORICAL_LANDSLIDES, 'year');
  const years = Object.keys(byYear).sort();
  barChart('chart-year', years, years.map(y => byYear[y]), '#2FB8A6');

  const bySev = groupCount(HISTORICAL_LANDSLIDES, 'severity');
  const sevOrder = ['Low','Moderate','High','Critical'];
  const sevColors = { Low:'#3ED07C', Moderate:'#F0C93D', High:'#FF9A3D', Critical:'#FF5252' };
  const sevLabels = sevOrder.filter(s => bySev[s]);
  barChart('chart-severity', sevLabels, sevLabels.map(s => bySev[s]), sevLabels.map(s => sevColors[s]));

  const byLoc = groupCount(HISTORICAL_LANDSLIDES, 'location');
  const maxLoc = Math.max(...Object.values(byLoc));
  document.getElementById('loc-bars').innerHTML = Object.entries(byLoc).sort((a,b)=>b[1]-a[1]).map(([loc,count]) => `
    <div class="bar-row">
      <div class="b-label">${loc}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(count/maxLoc)*100}%; background:var(--accent)"></div></div>
      <div class="b-pct">${count}</div>
    </div>
  `).join('');

  document.getElementById('hist-table-body').innerHTML = [...HISTORICAL_LANDSLIDES].sort((a,b)=>b.year-a.year).map(h => `
    <tr>
      <td class="mono">${h.year}</td>
      <td>${h.location}</td>
      <td><span class="badge badge-${{Low:'low',Moderate:'mod',High:'high',Critical:'crit'}[h.severity]}">${h.severity}</span></td>
      <td class="mono">${h.deaths}</td>
      <td class="mono">${h.roadsBlocked}</td>
    </tr>
  `).join('');
}

render();
