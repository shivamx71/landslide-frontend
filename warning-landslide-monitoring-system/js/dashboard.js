/* =========================================================
   dashboard.js
   ========================================================= */

initShell({ active: 'dashboard.html', title: 'Command Dashboard', crumb: 'Monitor / Dashboard' });

let activeLoc = getLocationById(lsGet(LS_KEYS.ACTIVE_LOCATION, 'east-sikkim'));

function setNeedle(score){
  // gauge spans -90deg (score 0) to +90deg (score 100) around pivot (110,110)
  const angle = -90 + (score/100)*180;
  document.getElementById('db-needle').style.transform = `rotate(${angle}deg)`;
}

function renderLocationSelect(){
  const sel = document.getElementById('location-select');
  sel.innerHTML = DEMO_LOCATIONS.map(l => `<option value="${l.id}" ${l.id===activeLoc.id?'selected':''}>${l.name}</option>`).join('');
  sel.onchange = () => {
    activeLoc = getLocationById(sel.value);
    lsSet(LS_KEYS.ACTIVE_LOCATION, activeLoc.id);
    renderLocation();
  };
}

function renderLocation(){
  const rm = riskMeta(activeLoc.riskLevel);
  document.getElementById('db-loc-name').textContent = activeLoc.name;
  document.getElementById('db-score').textContent = activeLoc.riskScore;
  document.getElementById('db-rainfall').innerHTML = activeLoc.rainfall + ' <small>mm</small>';
  document.getElementById('db-soil').innerHTML = activeLoc.soilMoisture + '<small>%</small>';
  document.getElementById('db-slope').innerHTML = activeLoc.slope + '<small>°</small>';
  document.getElementById('db-elev').innerHTML = activeLoc.elevation + '<small>m</small>';
  document.getElementById('db-hist').textContent = activeLoc.historicalLandslides;
  document.getElementById('db-alerts-count').textContent = activeLoc.activeAlerts;
  document.getElementById('db-sync-time').textContent = 'just now';

  const badge = document.getElementById('db-status-badge');
  badge.className = 'badge badge-' + rm.cls;
  badge.innerHTML = `<span class="badge-dot"></span> ${rm.label}`;

  const warnLine = document.getElementById('db-warn-line');
  if (activeLoc.riskLevel === 'critical'){
    warnLine.style.display = 'flex';
    warnLine.textContent = '⚠️ Immediate monitoring required';
  } else if (activeLoc.riskLevel === 'high'){
    warnLine.style.display = 'flex';
    warnLine.textContent = '⚠️ Field inspection recommended';
  } else {
    warnLine.style.display = 'none';
  }

  setTimeout(() => setNeedle(activeLoc.riskScore), 150);
}

function renderPriorityList(){
  const ranked = [...DEMO_LOCATIONS].sort((a,b) => b.riskScore - a.riskScore).slice(0,4);
  document.getElementById('db-priority-list').innerHTML = ranked.map((l, i) => {
    const rm = riskMeta(l.riskLevel);
    return `
      <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border-soft);">
        <div style="font-family:var(--font-mono); font-weight:700; color:var(--text-faint); width:20px;">${i+1}</div>
        <div style="flex:1;">
          <div style="font-weight:600; font-size:13.5px;">${l.name}</div>
          <div style="font-size:11.5px; color:var(--text-faint);">Score ${l.riskScore} · ${l.roadStatus.replace('-',' ')}</div>
        </div>
        <span class="badge badge-${rm.cls}">${rm.label}</span>
      </div>
    `;
  }).join('');
}

function renderDashboardMap(){
  const map = baseMap('dashboard-map', [26.0, 91.8], 5.6);
  addLocationMarkers(map, DEMO_LOCATIONS);
}

function renderHistChart(){
  const canvas = document.getElementById('db-hist-chart');
  const ctx = canvas.getContext('2d');
  const data = HISTORICAL_LANDSLIDES.filter(h => h.location === 'East Sikkim');
  drawSimpleBarChart(ctx, canvas, data.map(d => d.year), data.map(d => d.deaths), '#FF5252', 'Impact events');
}

// minimal dependency-free bar chart renderer (used pre-Chart.js load fallback)
function drawSimpleBarChart(ctx, canvas, labels, values, color, ylabel){
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.height;
  canvas.width = w*dpr; canvas.height = h*dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0,0,w,h);
  const max = Math.max(...values, 1);
  const padL = 30, padB = 24, padT = 10;
  const barW = (w - padL - 10) / values.length * 0.6;
  const gap = (w - padL - 10) / values.length;
  ctx.strokeStyle = '#223040'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(padL, h-padB); ctx.lineTo(w-5, h-padB); ctx.stroke();
  values.forEach((v,i) => {
    const barH = (v/max) * (h - padT - padB);
    const x = padL + i*gap + (gap-barW)/2;
    const y = h - padB - barH;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, barW, barH, 4) : ctx.rect(x,y,barW,barH);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#647588';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i], x+barW/2, h-8);
    ctx.fillStyle = '#93A6B5';
    ctx.fillText(v, x+barW/2, y-6);
  });
}

renderLocationSelect();
renderLocation();
renderPriorityList();
renderDashboardMap();
renderHistChart();
