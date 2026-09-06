/* =========================================================
   weather.js — simulated demo weather (frontend-only)
   ========================================================= */

initShell({ active: 'weather.html', title: 'Weather', crumb: 'Insights / Weather' });

const WEATHER_PROFILES = {
  'east-sikkim': { temp: 18, humidity: 86, wind: 14, icon: '🌧️', desc: 'Heavy rain, overcast skies', forecast: [182,164,140,120,95,70,55] },
  'gangtok':     { temp: 19, humidity: 78, wind: 11, icon: '🌦️', desc: 'Intermittent showers', forecast: [121,110,98,85,72,60,50] },
  'aizawl':      { temp: 24, humidity: 74, wind: 9,  icon: '🌦️', desc: 'Scattered showers', forecast: [143,130,110,95,80,68,55] },
  'kohima':      { temp: 21, humidity: 70, wind: 10, icon: '⛅', desc: 'Cloudy with light rain', forecast: [132,120,105,90,75,60,48] },
  'shillong':    { temp: 20, humidity: 62, wind: 8,  icon: '🌤️', desc: 'Partly cloudy', forecast: [96,88,80,70,60,52,44] }
};

function renderSelect(){
  const sel = document.getElementById('weather-loc-select');
  sel.innerHTML = DEMO_LOCATIONS.map(l => `<option value="${l.id}">${l.name}</option>`).join('');
  sel.value = lsGet(LS_KEYS.ACTIVE_LOCATION, 'east-sikkim');
  sel.onchange = () => render(sel.value);
}

function render(id){
  const loc = getLocationById(id);
  const w = WEATHER_PROFILES[id] || WEATHER_PROFILES['east-sikkim'];
  document.getElementById('w-icon').textContent = w.icon;
  document.getElementById('w-temp').textContent = w.temp + '°C';
  document.getElementById('w-desc').textContent = w.desc + ' — ' + loc.name;
  document.getElementById('w-rain').textContent = loc.rainfall + ' mm';
  document.getElementById('w-rain2').innerHTML = loc.rainfall + '<small>mm</small>';
  document.getElementById('w-humidity').innerHTML = w.humidity + '<small>%</small>';
  document.getElementById('w-wind').innerHTML = w.wind + '<small>km/h</small>';
  document.getElementById('w-temp2').innerHTML = w.temp + '<small>°C</small>';
  drawForecast(w.forecast);
}

function drawForecast(values){
  const canvas = document.getElementById('w-forecast');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.height;
  canvas.width = w*dpr; canvas.height = h*dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0,0,w,h);
  const labels = ['Today','+1d','+2d','+3d','+4d','+5d','+6d'];
  const max = Math.max(...values);
  const padL = 30, padB = 24, padT = 14;
  const stepX = (w - padL - 10) / (values.length-1);
  ctx.beginPath();
  values.forEach((v,i) => {
    const x = padL + i*stepX;
    const y = padT + (1 - v/max) * (h - padT - padB);
    if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.strokeStyle = '#4CA6E0'; ctx.lineWidth = 2.5; ctx.stroke();

  ctx.lineTo(padL + (values.length-1)*stepX, h-padB);
  ctx.lineTo(padL, h-padB);
  ctx.closePath();
  ctx.fillStyle = 'rgba(76,166,224,0.12)';
  ctx.fill();

  values.forEach((v,i) => {
    const x = padL + i*stepX;
    const y = padT + (1 - v/max) * (h - padT - padB);
    ctx.beginPath(); ctx.arc(x,y,3.5,0,Math.PI*2); ctx.fillStyle = '#4CA6E0'; ctx.fill();
    ctx.fillStyle = '#647588'; ctx.font = '10px Inter, sans-serif'; ctx.textAlign='center';
    ctx.fillText(labels[i], x, h-8);
    ctx.fillStyle = '#93A6B5';
    ctx.fillText(v+'mm', x, y-8);
  });
}

renderSelect();
render(lsGet(LS_KEYS.ACTIVE_LOCATION, 'east-sikkim'));
