/* =========================================================
   mapcommon.js — Shared Leaflet Helpers for 24x7 Live GIS Map
   ========================================================= */

const RISK_HEX = { 
  low: '#16a34a', 
  moderate: '#ca8a04', 
  high: '#ea580c', 
  critical: '#dc2626' 
};

function coloredIcon(hex, size) {
  size = size || 26;
  const isDanger = hex === '#dc2626' || hex === '#FF5252';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position:relative; width:${size}px; height:${size}px;">
        ${isDanger ? `<div style="position:absolute; width:100%; height:100%; border-radius:50%; background:${hex}; opacity:0.6; animation: marker-pulse 1.8s infinite ease-out;"></div>` : ''}
        <div style="position:relative; width:${size}px; height:${size}px; border-radius:50%; background:${hex};
          border: 2.5px solid rgba(255,255,255,0.95); box-shadow: 0 0 0 3px ${hex}44, 0 3px 10px rgba(0,0,0,0.6);
          display:flex; align-items:center; justify-content:center; color:#fff; font-size:10px; font-weight:700;">
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
}

function emergencyIcon() {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:22px;height:22px;border-radius:6px;background:#0f172a;border:2px solid #2dd4bf;
      display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,0.5);">🚑</div>`,
    iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -11]
  });
}

function reportIcon() {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:20px;height:20px;border-radius:5px;background:#0f172a;border:2px solid #f59e0b;
      display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 2px 8px rgba(0,0,0,0.5);">📷</div>`,
    iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -10]
  });
}

// 100% Free ESRI High-Definition Dark Canvas Tiles (Zero API Key, Zero Watermarks!)
function baseMap(elId, center, zoom) {
  const map = L.map(elId, { scrollWheelZoom: true }).setView(center || [26.0, 92.0], zoom || 6.2);
  
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; Esri &mdash; Survey of India &copy; ISRO NRSC',
    maxZoom: 16
  }).addTo(map);

  return map;
}

function locationPopupHtml(loc) {
  const score = Math.round(loc.risk_score ?? loc.riskScore ?? 45);
  const rawLevel = String(loc.risk_level ?? loc.riskLevel ?? (score >= 75 ? 'critical' : score >= 55 ? 'high' : 'moderate')).toLowerCase();
  
  const rm = (typeof riskMeta === 'function') 
    ? riskMeta(rawLevel) 
    : { cls: rawLevel === 'critical' ? 'danger' : rawLevel === 'high' ? 'warning' : 'info', label: rawLevel.toUpperCase() };

  const rain = Number(loc.rainfall_24h ?? loc.rainfall_24h_mm ?? loc.rainfall ?? 0).toFixed(1);
  const soil = Number(loc.soil_moisture ?? loc.soil_moisture_percent ?? loc.soilMoisture ?? 45).toFixed(1);
  const slope = Number(loc.slope ?? loc.slope_degrees ?? 28).toFixed(0);
  const elev = Number(loc.elevation ?? loc.elevation_meters ?? 1400).toFixed(0);
  const color = loc.color || RISK_HEX[rawLevel] || '#ca8a04';
  const weather = loc.weather_condition || 'Partly Cloudy';
  const factor = loc.primary_factor || 'Continuous Satellite Radar Active';

  return `
    <div class="map-popup" style="min-width: 210px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <h4 style="margin:0; font-size:15px; font-weight:700;">${loc.name}</h4>
        <span class="badge badge-${rm.cls}" style="font-size:11px; border:1px solid ${color};">
          ${score} · ${rm.label}
        </span>
      </div>
      <div class="prow"><span>Live 24h Rain</span><b>${rain} mm</b></div>
      <div class="prow"><span>Soil Saturation</span><b>${soil}%</b></div>
      <div class="prow"><span>Slope / Elev</span><b>${slope}° / ${elev}m</b></div>
      <div class="prow"><span>Atmosphere</span><b>${weather}</b></div>
      <div style="margin-top:8px; padding-top:6px; border-top:1px solid rgba(255,255,255,0.1); font-size:11px; color:${color}; font-weight:600;">
        ⚠️ ${factor}
      </div>
      <button class="btn btn-primary btn-sm btn-block" style="margin-top:10px; width:100%; cursor:pointer;" 
              onclick="window.location.href='risk-analysis.html?loc=${loc.id}'">
        Detailed AI Analysis →
      </button>
    </div>
  `;
}

function addLocationMarkers(map, locations, opts) {
  if (!map || !Array.isArray(locations)) return {};
  opts = opts || {};
  const markers = {};

  locations.forEach(loc => {
    const lat = Number(loc.latitude ?? loc.lat);
    const lng = Number(loc.longitude ?? loc.lng);
    if (isNaN(lat) || isNaN(lng)) return;

    const score = Math.round(loc.risk_score ?? loc.riskScore ?? 45);
    const level = String(loc.risk_level ?? loc.riskLevel ?? (score >= 75 ? 'critical' : score >= 55 ? 'high' : 'moderate')).toLowerCase();
    const hex = loc.color || RISK_HEX[level] || '#ca8a04';

    const marker = L.marker([lat, lng], { 
      icon: coloredIcon(hex, opts.size || 26) 
    }).addTo(map);

    marker.bindPopup(locationPopupHtml(loc));

    if (level === 'critical' || level === 'high' || score >= 55) {
      L.circle([lat, lng], {
        radius: opts.zoneRadius || (level === 'critical' ? 24000 : 16000),
        color: hex,
        fillColor: hex,
        fillOpacity: level === 'critical' ? 0.2 : 0.1,
        weight: 1.5,
        dashArray: level === 'critical' ? null : '4 4'
      }).addTo(map);
    }

    markers[loc.id] = marker;
  });

  return markers;
}

if (!document.getElementById('marker-pulse-style')) {
  const style = document.createElement('style');
  style.id = 'marker-pulse-style';
  style.innerHTML = `
    @keyframes marker-pulse {
      0% { transform: scale(1); opacity: 0.8; }
      70% { transform: scale(2.2); opacity: 0; }
      100% { transform: scale(2.2); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}