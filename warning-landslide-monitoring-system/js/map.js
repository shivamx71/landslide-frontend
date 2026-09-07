/* =========================================================
   map.js — Risk Map: OGC GeoJSON, Live SQLite Pins & Navigation
   ========================================================= */

initShell({ active: 'risk-map.html', title: 'Risk Map', crumb: 'Monitor / Risk Map' });

const API_BASE = typeof BACKEND_URL !== 'undefined' ? BACKEND_URL : "https://sih-landslide-backend-kzl9.onrender.com";

const map = baseMap('gis-map', [25.8, 92.2], 6);

const layerGroups = {
  riskzones: L.layerGroup().addTo(map),
  locations: L.layerGroup().addTo(map),
  historical: L.layerGroup(),
  reports: L.layerGroup().addTo(map),
  roads: L.layerGroup(),
  emergency: L.layerGroup()
};

// ---------------- 1. GIS CHOROPLETH BOUNDARIES FROM FASTAPI (/geojson) ----------------
async function loadGeoJsonBoundaries() {
  try {
    const res = await fetch(`${API_BASE}/geojson`);
    if (!res.ok) throw new Error("GeoJSON API offline");
    const geoData = await res.json();

    const geoLayer = L.geoJSON(geoData, {
      style: function(feature) {
        const lvl = (feature.properties.riskLevel || 'moderate').toLowerCase();
        const colorMap = {
          critical: '#FF5252',
          high: '#FF9A3D',
          moderate: '#F0C93D',
          low: '#3ED07C'
        };
        const color = colorMap[lvl] || '#F0C93D';
        return {
          color: color,
          fillColor: color,
          fillOpacity: lvl === 'critical' ? 0.35 : (lvl === 'high' ? 0.28 : 0.18),
          weight: lvl === 'critical' ? 2.5 : 1.5,
          dashArray: lvl === 'critical' ? null : '3 3'
        };
      },
      onEachFeature: function(feature, layer) {
        const p = feature.properties;
        const dName = p.district || p.name || 'NER District';
        const sName = p.state || 'North-East Region';
        const rLvl = (p.riskLevel || 'moderate').toUpperCase();
        const rScore = p.riskScore || 65;

        layer.on({
          mouseover: function(e) {
            const l = e.target;
            l.setStyle({ weight: 3.5, fillOpacity: 0.5 });
            l.bringToFront();
          },
          mouseout: function(e) {
            geoLayer.resetStyle(e.target);
          },
          click: function(e) {
            map.fitBounds(e.target.getBounds(), { padding: [20, 20] });
          }
        });

        layer.bindPopup(`
          <div class="map-popup">
            <h4>${dName}</h4>
            <div class="prow"><span>State</span><b>${sName}</b></div>
            <div class="prow"><span>Hazard Tier</span><b style="color:${p.riskLevel==='critical'?'#FF5252':'#FF9A3D'};">${rLvl}</b></div>
            <div class="prow"><span>Risk Score</span><b>${rScore} / 100</b></div>
            <div class="prow"><span>GIS Standard</span><b>OGC / WGS 84</b></div>
            <div style="margin-top:8px;font-size:11px;color:var(--text-faint);">Source: Survey of India / ISRO NRSC Atlas</div>
          </div>
        `);
      }
    });

    geoLayer.addTo(layerGroups.riskzones);
    console.log(">>> [GIS] North-East Choropleth Boundary Polygons rendered from FastAPI!");
  } catch (err) {
    console.warn(">>> [GIS] Boundary fallback mode:", err);
  }
}
loadGeoJsonBoundaries();

// ---------------- 2. REAL SATELLITE VIEW SWITCH (ESRI WORLD IMAGERY) ----------------
const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; High-Resolution Satellite Topography'
});

const satControl = L.control({ position: 'topright' });
satControl.onAdd = function() {
  const div = L.DomUtil.create('div', 'leaflet-bar');
  div.innerHTML = `
    <button id="btn-toggle-satellite" style="
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid #334155;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      gap: 6px;
    ">🛰️ Satellite View</button>
  `;
  return div;
};
satControl.addTo(map);

let isSatellite = false;
setTimeout(() => {
  const btn = document.getElementById('btn-toggle-satellite');
  if (btn) {
    btn.addEventListener('click', () => {
      isSatellite = !isSatellite;
      if (isSatellite) {
        satelliteLayer.addTo(map);
        btn.style.background = '#3b82f6';
        btn.style.color = '#ffffff';
        btn.innerHTML = '🗺️ Standard View';
      } else {
        map.removeLayer(satelliteLayer);
        btn.style.background = '#1e293b';
        btn.style.color = '#f8fafc';
        btn.innerHTML = '🛰️ Satellite View';
      }
    });
  }
}, 300);

// ---------------- 3. CORE MARKERS & DISTRICT PINS ----------------
DEMO_LOCATIONS.forEach(loc => {
  const hex = RISK_HEX[loc.riskLevel] || '#F0C93D';
  if (loc.riskLevel === 'critical' || loc.riskLevel === 'high'){
    L.circle([loc.lat, loc.lng], {
      radius: loc.riskLevel === 'critical' ? 26000 : 18000,
      color: hex, fillColor: hex, fillOpacity: 0.1, weight: 1.4, dashArray: loc.riskLevel==='critical' ? null : '4 4'
    }).addTo(layerGroups.riskzones);
  }
  const marker = L.marker([loc.lat, loc.lng], { icon: coloredIcon(hex, 28) });
  marker.bindPopup(locationPopupHtml(loc));
  marker.addTo(layerGroups.locations);
});

// Historical landslide points
const cityCoords = { 'East Sikkim':[27.3389,88.6065], 'Gangtok':[27.3314,88.6138], 'Aizawl':[23.7271,92.7176], 'Kohima':[25.6751,94.1086], 'Shillong':[25.5788,91.8933] };
HISTORICAL_LANDSLIDES.forEach((h, i) => {
  const base = cityCoords[h.location];
  if (!base) return;
  const jitter = 0.05;
  const lat = base[0] + (Math.sin(i*13.7)*jitter);
  const lng = base[1] + (Math.cos(i*9.3)*jitter);
  const sevColor = { Low:'#3ED07C', Moderate:'#F0C93D', High:'#FF9A3D', Critical:'#FF5252' }[h.severity] || '#93A6B5';
  L.circleMarker([lat,lng], { radius:6, color: sevColor, fillColor: sevColor, fillOpacity:0.7, weight:1 })
    .bindPopup(`<div class="map-popup"><h4>${h.location} · ${h.year}</h4><div class="prow"><span>Severity</span><b>${h.severity}</b></div><div class="prow"><span>Deaths</span><b>${h.deaths}</b></div><div class="prow"><span>Roads blocked</span><b>${h.roadsBlocked}</b></div></div>`)
    .addTo(layerGroups.historical);
});

// Field reports (Sync with Live SQLite DB: GET /reports)
async function renderAllFieldReports() {
  try {
    const res = await fetch(`${API_BASE}/reports`);
    if (res.ok) {
      const liveData = await res.json();
      liveData.forEach(r => {
        if (!r.latitude || !r.longitude) return;
        L.marker([r.latitude, r.longitude], { icon: reportIcon() })
          .bindPopup(`<div class="map-popup"><h4>${r.report_type}</h4><div class="prow"><span>Source</span><b>Live SQLite DB</b></div><div class="prow"><span>Logged</span><b>${fmtDate(r.created_at)}</b></div><p style="margin-top:8px;font-size:12.5px;color:var(--text-dim);">${r.description}</p></div>`)
          .addTo(layerGroups.reports);
      });
      console.log(">>> [GIS MAP] Live SQLite Incident markers added to map:", liveData.length);
    }
  } catch(e){
    console.warn("Using local report pins fallback:", e);
    lsGet(LS_KEYS.REPORTS, []).forEach(r => {
      if (!r.lat || !r.lng) return;
      L.marker([r.lat, r.lng], { icon: reportIcon() })
        .bindPopup(`<div class="map-popup"><h4>${r.type}</h4><div class="prow"><span>Location</span><b>${r.location}</b></div><div class="prow"><span>Submitted</span><b>${fmtDate(r.submittedAt)}</b></div><p style="margin-top:8px;font-size:12.5px;color:var(--text-dim);">${r.description}</p></div>`)
        .addTo(layerGroups.reports);
    });
  }
}
renderAllFieldReports();

// Roads
ROAD_SEGMENTS.forEach((r, i) => {
  const base = cityCoords[r.location];
  if (!base) return;
  const color = { open:'#3ED07C', 'at-risk':'#FF9A3D', blocked:'#FF5252' }[r.status];
  const a = [base[0] + 0.02*Math.sin(i), base[1] + 0.02*Math.cos(i)];
  const b = [base[0] - 0.03*Math.cos(i), base[1] + 0.04*Math.sin(i*1.3)];
  L.polyline([a,b], { color, weight: 4, opacity: 0.85 })
    .bindPopup(`<div class="map-popup"><h4>${r.name}</h4><div class="prow"><span>Status</span><b>${r.status.replace('-',' ')}</b></div><div class="prow"><span>Updated</span><b>${r.lastUpdate}</b></div><p style="margin-top:6px;font-size:12px;color:var(--text-dim);">${r.note}</p></div>`)
    .addTo(layerGroups.roads);
});

// Emergency centers
EMERGENCY_CENTERS.forEach(c => {
  L.marker([c.lat, c.lng], { icon: emergencyIcon() })
    .bindPopup(`<div class="map-popup"><h4>${c.name}</h4><div class="prow"><span>Type</span><b>Response unit</b></div></div>`)
    .addTo(layerGroups.emergency);
});

// Layer checkboxes binding
function bindLayerToggle(checkboxId, group){
  const el = document.getElementById(checkboxId);
  if (el) {
    el.addEventListener('change', e => {
      if (e.target.checked) map.addLayer(group); else map.removeLayer(group);
    });
  }
}
bindLayerToggle('lyr-riskzones', layerGroups.riskzones);
bindLayerToggle('lyr-locations', layerGroups.locations);
bindLayerToggle('lyr-historical', layerGroups.historical);
bindLayerToggle('lyr-reports', layerGroups.reports);
bindLayerToggle('lyr-roads', layerGroups.roads);
bindLayerToggle('lyr-emergency', layerGroups.emergency);

// URL Navigation Handler (Alerts ya Priority page se aane par seedha us location par fly kare)
(function handleQueryNavigation(){
  const params = new URLSearchParams(window.location.search);
  const locId = params.get('loc');
  if (locId) {
    const target = DEMO_LOCATIONS.find(l => String(l.id) === String(locId));
    if (target) {
      setTimeout(() => {
        map.flyTo([target.lat, target.lng], 10, { duration: 1.5 });
      }, 500);
    }
  }
})();

// quick-jump chips
const chipsEl = document.getElementById('map-search-chips');
if (chipsEl) {
  chipsEl.innerHTML = DEMO_LOCATIONS.map(l =>
    `<span class="chip" onclick="map.flyTo([${l.lat},${l.lng}], 10, {duration:1});" style="cursor:pointer;">${l.name}</span>`
  ).join('');
}

// location summary cards below map
const cardsEl = document.getElementById('map-loc-cards');
if (cardsEl) {
  cardsEl.innerHTML = DEMO_LOCATIONS.map(l => {
    const rm = riskMeta(l.riskLevel);
    return `
      <div class="panel panel-pad">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div style="font-weight:700; font-family:var(--font-display);">${l.name}</div>
            <div class="text-faint" style="font-size:11.5px;">${l.state}</div>
          </div>
          <span class="badge badge-${rm.cls}">${rm.label}</span>
        </div>
        <div style="font-family:var(--font-mono); font-size:22px; font-weight:700; margin:10px 0 2px;">${l.riskScore}<span style="font-size:12px;color:var(--text-faint);"> /100</span></div>
        <div class="text-faint" style="font-size:11.5px;">Rainfall ${l.rainfall}mm · Soil ${l.soilMoisture}% · Slope ${l.slope}°</div>
        <button class="btn btn-outline btn-sm btn-block" style="margin-top:12px;" onclick="map.flyTo([${l.lat},${l.lng}],10,{duration:1})">View on map</button>
      </div>
    `;
  }).join('');
}