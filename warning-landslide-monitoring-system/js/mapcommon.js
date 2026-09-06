/* =========================================================
   mapcommon.js — shared Leaflet helpers for OSM risk map
   ========================================================= */

const RISK_HEX = { low: '#3ED07C', moderate: '#F0C93D', high: '#FF9A3D', critical: '#FF5252' };

function coloredIcon(hex, size){
  size = size || 26;
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${hex};
      border:3px solid rgba(255,255,255,0.85); box-shadow:0 0 0 4px ${hex}33, 0 2px 8px rgba(0,0,0,0.5);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2]
  });
}

function emergencyIcon(){
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:22px;height:22px;border-radius:6px;background:#131B23;border:2px solid #2FB8A6;
      display:flex;align-items:center;justify-content:center;font-size:12px;">🚑</div>`,
    iconSize: [22,22], iconAnchor:[11,11], popupAnchor:[0,-11]
  });
}

function reportIcon(){
  return L.divIcon({
    className:'custom-marker',
    html:`<div style="width:20px;height:20px;border-radius:5px;background:#131B23;border:2px solid #F0C93D;
      display:flex;align-items:center;justify-content:center;font-size:11px;">📷</div>`,
    iconSize:[20,20], iconAnchor:[10,10], popupAnchor:[0,-10]
  });
}

function baseMap(elId, center, zoom){
  const map = L.map(elId, { scrollWheelZoom: true }).setView(center || [26.3, 91.5], zoom || 6.4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(map);
  return map;
}

function locationPopupHtml(loc){
  const rm = riskMeta(loc.riskLevel);
  return `
    <div class="map-popup">
      <h4>${loc.name}</h4>
      <span class="badge badge-${rm.cls}"><span class="badge-dot"></span> ${rm.label}</span>
      <div style="margin-top:10px;">
        <div class="prow"><span>Risk score</span><b>${loc.riskScore}/100</b></div>
        <div class="prow"><span>Rainfall (24h)</span><b>${loc.rainfall} mm</b></div>
        <div class="prow"><span>Soil moisture</span><b>${loc.soilMoisture}%</b></div>
        <div class="prow"><span>Slope</span><b>${loc.slope}°</b></div>
      </div>
      <button class="btn btn-primary btn-sm btn-block" style="margin-top:12px;" onclick="window.location.href='risk-analysis.html?loc=${loc.id}'">View Details</button>
    </div>
  `;
}

function addLocationMarkers(map, locations, opts){
  opts = opts || {};
  const markers = {};
  locations.forEach(loc => {
    const marker = L.marker([loc.lat, loc.lng], { icon: coloredIcon(RISK_HEX[loc.riskLevel], opts.size) }).addTo(map);
    marker.bindPopup(locationPopupHtml(loc));
    if (loc.riskLevel === 'critical' || loc.riskLevel === 'high'){
      L.circle([loc.lat, loc.lng], {
        radius: opts.zoneRadius || 22000,
        color: RISK_HEX[loc.riskLevel],
        fillColor: RISK_HEX[loc.riskLevel],
        fillOpacity: 0.08,
        weight: 1
      }).addTo(map);
    }
    markers[loc.id] = marker;
  });
  return markers;
}
