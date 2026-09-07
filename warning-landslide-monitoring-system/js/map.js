/* =========================================================
   map.js — 100% 24x7 Real-Time GIS Risk Map & Cinematic FlyTo
   ========================================================= */

initShell({ active: 'risk-map.html', title: 'Risk Map', crumb: 'Monitor / Risk Map' });

const API_BASE = typeof BACKEND_URL !== 'undefined' ? BACKEND_URL : "https://sih-landslide-backend-kzl9.onrender.com";

const map = baseMap('gis-map', [26.0, 92.2], 6.2);

const layerGroups = {
  riskzones: L.layerGroup().addTo(map),
  locations: L.layerGroup().addTo(map),
  historical: L.layerGroup(),
  reports: L.layerGroup().addTo(map),
  roads: L.layerGroup(),
  emergency: L.layerGroup()
};

let liveDistrictsList = [];
window._districtMarkers = {};

// Helper: Custom Rich Popup for Live District Pins
function createLivePopupHtml(l) {
  const rm = (typeof riskMeta === 'function') 
    ? riskMeta((l.risk_level || 'moderate').toLowerCase()) 
    : { cls: 'warning', label: String(l.risk_level || 'MODERATE').toUpperCase() };

  return `
    <div class="map-popup" style="min-width: 220px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid var(--border-soft); padding-bottom:6px;">
        <h4 style="margin:0; font-size:14.5px; font-weight:700;">${l.name}</h4>
        <span class="badge badge-${rm.cls}" style="font-size:10.5px; font-weight:700; border:1px solid ${l.color};">
          ${l.risk_score} · ${rm.label}
        </span>
      </div>
      <div class="prow"><span>Live 24h Rain</span><b>${Number(l.rainfall_24h).toFixed(1)} mm</b></div>
      <div class="prow"><span>Soil Saturation</span><b>${Number(l.soil_moisture).toFixed(1)}%</b></div>
      <div class="prow"><span>Terrain Slope</span><b>${l.slope}° (${l.elevation}m)</b></div>
      <div class="prow"><span>Weather</span><b>${l.weather_condition || 'Partly Cloudy'} (${l.temperature || 21}°C)</b></div>
      <div style="margin-top:8px; padding-top:6px; border-top:1px solid var(--border-soft); font-size:11px; color:${l.color}; font-weight:600;">
        ⚠️ ${l.primary_factor || 'Atmospheric parameters monitored'}
      </div>
    </div>
  `;
}

// ---------------- 1. GIS CHOROPLETH BOUNDARIES (/geojson) ----------------
async function loadGeoJsonBoundaries() {
  try {
    const res = await fetch(`${API_BASE}/geojson`);
    if (!res.ok) throw new Error("GeoJSON API offline");
    const geoData = await res.json();

    const geoLayer = L.geoJSON(geoData, {
      style: function(feature) {
        const lvl = (feature.properties.riskLevel || 'moderate').toLowerCase();
        const colorMap = {
          critical: '#dc2626',
          high: '#ea580c',
          moderate: '#ca8a04',
          low: '#16a34a'
        };
        const color = colorMap[lvl] || '#ca8a04';
        return {
          color: color,
          fillColor: color,
          fillOpacity: lvl === 'critical' ? 0.35 : (lvl === 'high' ? 0.25 : 0.15),
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
            <div class="prow"><span>Hazard Tier</span><b>${rLvl}</b></div>
            <div class="prow"><span>Risk Score</span><b>${rScore} / 100</b></div>
            <div style="margin-top:8px;font-size:11px;color:var(--text-faint);">Source: Survey of India / ISRO NRSC Atlas</div>
          </div>
        `);
      }
    });

    geoLayer.addTo(layerGroups.riskzones);
  } catch (err) {
    console.warn("Boundary fallback mode:", err);
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

// ---------------- 3. RENDER ALL 43+ NER DISTRICTS FROM LIVE BACKEND ----------------
async function loadLiveDistrictMarkers() {
  try {
    const res = await fetch(`${API_BASE}/locations?live=true`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const locations = await res.json();
    if (!Array.isArray(locations) || locations.length === 0) return;

    liveDistrictsList = locations;
    layerGroups.locations.clearLayers();
    window._districtMarkers = {};

    locations.forEach(loc => {
      const lat = Number(loc.latitude);
      const lon = Number(loc.longitude);
      const color = loc.color || '#ca8a04';
      const isHighRisk = loc.risk_score >= 55;
      const isCritical = loc.risk_score >= 75;

      if (isHighRisk) {
        L.circle([lat, lon], {
          radius: isCritical ? 24000 : 16000,
          color: color,
          fillColor: color,
          fillOpacity: isCritical ? 0.22 : 0.12,
          weight: 1.5,
          dashArray: isCritical ? null : '4 4'
        }).addTo(layerGroups.riskzones);
      }

      const markerIcon = (typeof coloredIcon === 'function') 
        ? coloredIcon(color, 28) 
        : undefined;

      const marker = L.marker([lat, lon], { icon: markerIcon });
      marker.bindPopup(createLivePopupHtml(loc));
      marker.addTo(layerGroups.locations);

      // Save marker references with both String and Number keys
      window._districtMarkers[String(loc.id)] = marker;
      window._districtMarkers[Number(loc.id)] = marker;
    });

    renderBottomLocationCards(locations);
    renderSearchChips(locations);

    // Run Auto-FlyTo navigation
    checkAndFlyToTarget(locations);

  } catch (e) {
    console.warn("Live markers error, checking fallback:", e);
    if (typeof DEMO_LOCATIONS !== 'undefined') {
      checkAndFlyToTarget(DEMO_LOCATIONS);
    }
  }
}

// ---------------- 4. BULLETPROOF FLYTO & AUTO-POPUP ----------------
function checkAndFlyToTarget(locations) {
  const params = new URLSearchParams(window.location.search);
  let locId = params.get('loc') || sessionStorage.getItem('wlms_focus_loc') || localStorage.getItem('wlms_active_location');

  if (!locId || !locations || !locations.length) return;

  // Clear session focus so future manual map visits don't auto-zoom
  sessionStorage.removeItem('wlms_focus_loc');

  const target = locations.find(l => 
    String(l.id) === String(locId) || 
    String(l.name).toLowerCase().includes(String(locId).toLowerCase())
  );

  if (target) {
    const lat = Number(target.latitude || target.lat);
    const lon = Number(target.longitude || target.lng);
    console.log(`>>> [MAP NAVIGATION FLYTO] Flying straight to: ${target.name} (${lat}, ${lon})`);

    setTimeout(() => {
      // Cinematic zoom-in to location
      map.flyTo([lat, lon], 11, { 
        duration: 1.8,
        easeLinearity: 0.25 
      });

      // Automatically pop open popup after camera lands
      setTimeout(() => {
        const m = window._districtMarkers[target.id] || window._districtMarkers[String(target.id)];
        if (m) {
          m.openPopup();
          if (m.bringToFront) m.bringToFront();
        }
      }, 1900);
    }, 400);
  }
}

// Summary cards below map
function renderBottomLocationCards(locations) {
  const cardsEl = document.getElementById('map-loc-cards');
  if (!cardsEl) return;

  const sorted = [...locations].sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0)).slice(0, 8);

  cardsEl.innerHTML = sorted.map(l => {
    const rm = (typeof riskMeta === 'function') 
      ? riskMeta((l.risk_level || 'moderate').toLowerCase()) 
      : { cls: 'warning', label: (l.risk_level || 'MODERATE').toUpperCase() };

    return `
      <div class="panel panel-pad" style="border-top: 3px solid ${l.color};">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div style="font-weight:700; font-family:var(--font-display); font-size:15px;">${l.name}</div>
            <div class="text-faint" style="font-size:11.5px;">${l.weather_condition || 'NER Sector'} · ${l.temperature || 21}°C</div>
          </div>
          <span class="badge badge-${rm.cls}" style="border: 1px solid ${l.color};">${rm.label}</span>
        </div>
        <div style="font-family:var(--font-mono); font-size:22px; font-weight:700; margin:10px 0 2px; color:${l.color};">
          ${l.risk_score}<span style="font-size:12px; color:var(--text-faint);"> / 100</span>
        </div>
        <div class="text-faint" style="font-size:11.5px;">
          Rain ${Number(l.rainfall_24h).toFixed(1)}mm · Soil ${Number(l.soil_moisture).toFixed(1)}% · Slope ${l.slope}°
        </div>
        <button class="btn btn-outline btn-sm btn-block" style="margin-top:12px;" 
                onclick="map.flyTo([${l.latitude}, ${l.longitude}], 10.5, { duration: 1.2 })">
          View on map
        </button>
      </div>
    `;
  }).join('');
}

// Quick jump chips
function renderSearchChips(locations) {
  const chipsEl = document.getElementById('map-search-chips');
  if (!chipsEl) return;

  chipsEl.innerHTML = locations.slice(0, 10).map(l =>
    `<span class="chip" onclick="map.flyTo([${l.latitude}, ${l.longitude}], 10.5, { duration: 1.2 });" style="cursor:pointer;">
      <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${l.color}; margin-right:4px;"></span>
      ${l.name}
    </span>`
  ).join('');
}

// ---------------- 5. HISTORICAL LANDSLIDES, ROADS & REPORTS ----------------
const cityCoords = { 
  'East Sikkim':[27.3389,88.6065], 'Gangtok':[27.3314,88.6138], 
  'Aizawl':[23.7271,92.7176], 'Kohima':[25.6751,94.1086], 'Shillong':[25.5788,91.8933] 
};

if (typeof HISTORICAL_LANDSLIDES !== 'undefined') {
  HISTORICAL_LANDSLIDES.forEach((h, i) => {
    const base = cityCoords[h.location];
    if (!base) return;
    const jitter = 0.05;
    const lat = base[0] + (Math.sin(i * 13.7) * jitter);
    const lng = base[1] + (Math.cos(i * 9.3) * jitter);
    const sevColor = { Low: '#16a34a', Moderate: '#ca8a04', High: '#ea580c', Critical: '#dc2626' }[h.severity] || '#93A6B5';
    L.circleMarker([lat, lng], { radius: 6, color: sevColor, fillColor: sevColor, fillOpacity: 0.7, weight: 1 })
      .bindPopup(`<div class="map-popup"><h4>${h.location} · ${h.year}</h4><div class="prow"><span>Severity</span><b>${h.severity}</b></div><div class="prow"><span>Deaths</span><b>${h.deaths}</b></div><div class="prow"><span>Roads blocked</span><b>${h.roadsBlocked}</b></div></div>`)
      .addTo(layerGroups.historical);
  });
}

async function renderAllFieldReports() {
  try {
    const res = await fetch(`${API_BASE}/reports`);
    if (res.ok) {
      const liveData = await res.json();
      if (Array.isArray(liveData)) {
        liveData.forEach(r => {
          if (!r.latitude || !r.longitude) return;
          const icon = (typeof reportIcon === 'function') ? reportIcon() : undefined;
          L.marker([r.latitude, r.longitude], { icon: icon })
            .bindPopup(`<div class="map-popup"><h4>${r.report_type}</h4><div class="prow"><span>Source</span><b>Live Field Report</b></div><p style="margin-top:8px;font-size:12px;color:var(--text-dim);">${r.description}</p></div>`)
            .addTo(layerGroups.reports);
        });
      }
    }
  } catch (e) {}
}
renderAllFieldReports();

if (typeof ROAD_SEGMENTS !== 'undefined') {
  ROAD_SEGMENTS.forEach((r, i) => {
    const base = cityCoords[r.location];
    if (!base) return;
    const color = { open: '#16a34a', 'at-risk': '#ea580c', blocked: '#dc2626' }[r.status] || '#16a34a';
    const a = [base[0] + 0.02 * Math.sin(i), base[1] + 0.02 * Math.cos(i)];
    const b = [base[0] - 0.03 * Math.cos(i), base[1] + 0.04 * Math.sin(i * 1.3)];
    L.polyline([a, b], { color, weight: 4, opacity: 0.85 })
      .bindPopup(`<div class="map-popup"><h4>${r.name}</h4><div class="prow"><span>Status</span><b>${r.status.replace('-', ' ').toUpperCase()}</b></div><div class="prow"><span>Updated</span><b>${r.lastUpdate}</b></div><p style="margin-top:6px;font-size:12px;color:var(--text-dim);">${r.note}</p></div>`)
      .addTo(layerGroups.roads);
  });
}

if (typeof EMERGENCY_CENTERS !== 'undefined') {
  EMERGENCY_CENTERS.forEach(c => {
    const icon = (typeof emergencyIcon === 'function') ? emergencyIcon() : undefined;
    L.marker([c.lat, c.lng], { icon: icon })
      .bindPopup(`<div class="map-popup"><h4>${c.name}</h4><div class="prow"><span>Type</span><b>Disaster Relief Center</b></div></div>`)
      .addTo(layerGroups.emergency);
  });
}

function bindLayerToggle(checkboxId, group) {
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

// Initial execution & 45s Polling
loadLiveDistrictMarkers();
setInterval(loadLiveDistrictMarkers, 45000);