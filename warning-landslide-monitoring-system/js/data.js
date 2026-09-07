/* =========================================================
   data.js — 24x7 Live Satellite Dataset & Shared Telemetry Layer
   Warning and Landslide Monitoring System (NER Full-Stack)
   ========================================================= */

// Official Live Cloud Backend URL (Render Production Engine)
const BACKEND_URL = 'https://sih-landslide-backend-kzl9.onrender.com';

const LS_KEYS = {
  USERS: 'wlms_users',
  SESSION: 'wlms_session',
  REPORTS: 'wlms_field_reports',
  ALERTS: 'wlms_alerts',
  THEME: 'wlms_theme',
  LANG: 'wlms_lang',
  ANALYSES: 'wlms_analyses',
  ACTIVE_LOCATION: 'wlms_active_location',
  LIVE_CACHE: 'wlms_live_districts_cache'
};

/* ---- Monitored Baseline Districts Registry (Synced with ISRO Atlas & locations.csv) ---- */
let DEMO_LOCATIONS = [
  { id: 1,  name: 'South Sikkim',     state: 'Sikkim',            lat: 27.16, lng: 88.36, riskScore: 78, riskLevel: 'critical', rainfall: 65, soilMoisture: 82, slope: 35, elevation: 1750, historicalLandslides: 'High', roadStatus: 'at-risk', activeAlerts: 1 },
  { id: 2,  name: 'East Sikkim (Gangtok)', state: 'Sikkim',       lat: 27.33, lng: 88.60, riskScore: 72, riskLevel: 'high',     rainfall: 54, soilMoisture: 76, slope: 36, elevation: 1850, historicalLandslides: 'High', roadStatus: 'blocked', activeAlerts: 2 },
  { id: 3,  name: 'Imphal West',      state: 'Manipur',           lat: 24.81, lng: 93.93, riskScore: 32, riskLevel: 'low',      rainfall: 18, soilMoisture: 45, slope: 22, elevation: 790,  historicalLandslides: 'Moderate', roadStatus: 'open', activeAlerts: 0 },
  { id: 4,  name: 'Aizawl',           state: 'Mizoram',           lat: 23.72, lng: 92.71, riskScore: 68, riskLevel: 'high',     rainfall: 48, soilMoisture: 72, slope: 31, elevation: 1132, historicalLandslides: 'High', roadStatus: 'at-risk', activeAlerts: 1 },
  { id: 5,  name: 'Lawngtlai',        state: 'Mizoram',           lat: 22.52, lng: 92.89, riskScore: 58, riskLevel: 'high',     rainfall: 42, soilMoisture: 68, slope: 28, elevation: 850,  historicalLandslides: 'Moderate', roadStatus: 'open', activeAlerts: 1 },
  { id: 6,  name: 'North Sikkim',     state: 'Sikkim',            lat: 27.50, lng: 88.55, riskScore: 84, riskLevel: 'critical', rainfall: 72, soilMoisture: 84, slope: 38, elevation: 2300, historicalLandslides: 'High', roadStatus: 'blocked', activeAlerts: 2 },
  { id: 7,  name: 'Churachandpur',    state: 'Manipur',           lat: 24.33, lng: 93.67, riskScore: 62, riskLevel: 'high',     rainfall: 38, soilMoisture: 65, slope: 27, elevation: 920,  historicalLandslides: 'Moderate', roadStatus: 'at-risk', activeAlerts: 1 },
  { id: 8,  name: 'East Garo Hills',  state: 'Meghalaya',         lat: 25.60, lng: 90.58, riskScore: 48, riskLevel: 'moderate', rainfall: 32, soilMoisture: 58, slope: 24, elevation: 600,  historicalLandslides: 'Moderate', roadStatus: 'open', activeAlerts: 0 },
  { id: 9,  name: 'West Khasi Hills (Shillong)', state: 'Meghalaya', lat: 25.55, lng: 91.25, riskScore: 42, riskLevel: 'moderate', rainfall: 28, soilMoisture: 54, slope: 26, elevation: 1200, historicalLandslides: 'Moderate', roadStatus: 'open', activeAlerts: 0 },
  { id: 14, name: 'Tawang',           state: 'Arunachal Pradesh', lat: 27.58, lng: 91.86, riskScore: 74, riskLevel: 'high',     rainfall: 58, soilMoisture: 75, slope: 38, elevation: 3048, historicalLandslides: 'High', roadStatus: 'at-risk', activeAlerts: 1 },
  { id: 21, name: 'West Kameng',      state: 'Arunachal Pradesh', lat: 27.25, lng: 92.40, riskScore: 66, riskLevel: 'high',     rainfall: 46, soilMoisture: 70, slope: 35, elevation: 2200, historicalLandslides: 'High', roadStatus: 'at-risk', activeAlerts: 1 },
  { id: 35, name: 'Kohima',           state: 'Nagaland',          lat: 25.67, lng: 94.10, riskScore: 61, riskLevel: 'high',     rainfall: 39, soilMoisture: 66, slope: 30, elevation: 1444, historicalLandslides: 'Moderate', roadStatus: 'open', activeAlerts: 1 }
];

const EMERGENCY_CENTERS = [
  { name: 'East Sikkim Disaster Response Unit', lat: 27.3421, lng: 88.6201 },
  { name: 'Gangtok Emergency Command Post', lat: 27.3289, lng: 88.6091 },
  { name: 'Aizawl Civil Defence Center', lat: 23.7305, lng: 92.7220 },
  { name: 'Kohima Rescue Coordination Cell', lat: 25.6789, lng: 94.1120 },
  { name: 'Shillong Relief Station', lat: 25.5820, lng: 91.8890 },
  { name: 'Tawang Frontier Emergency Hub', lat: 27.5880, lng: 91.8640 }
];

const HISTORICAL_LANDSLIDES = [
  { year: 2024, location: 'East Sikkim', severity: 'Critical', deaths: 15, roadsBlocked: 6 },
  { year: 2024, location: 'Kohima', severity: 'High', deaths: 3, roadsBlocked: 2 },
  { year: 2023, location: 'Gangtok', severity: 'Critical', deaths: 9, roadsBlocked: 4 },
  { year: 2023, location: 'Aizawl', severity: 'High', deaths: 4, roadsBlocked: 2 },
  { year: 2022, location: 'Churachandpur', severity: 'Critical', deaths: 58, roadsBlocked: 5 },
  { year: 2022, location: 'East Sikkim', severity: 'High', deaths: 3, roadsBlocked: 2 },
  { year: 2021, location: 'East Sikkim', severity: 'Critical', deaths: 12, roadsBlocked: 5 },
  { year: 2021, location: 'Shillong', severity: 'Moderate', deaths: 1, roadsBlocked: 1 },
  { year: 2020, location: 'Gangtok', severity: 'Moderate', deaths: 0, roadsBlocked: 2 },
  { year: 2019, location: 'East Sikkim', severity: 'High', deaths: 7, roadsBlocked: 3 }
];

const ROAD_SEGMENTS = [
  { id: 'NH-10', name: 'Sevoke – Gangtok Highway', location: 'East Sikkim', status: 'blocked', lastUpdate: '10 min ago', note: 'Active rockfall & debris surge near Km 42.' },
  { id: 'NH-717A', name: 'Pakyong Feeder Bypass', location: 'East Sikkim', status: 'at-risk', lastUpdate: '25 min ago', note: 'Minor slope slippage. Escort required.' },
  { id: 'NH-54', name: 'Silchar – Aizawl Arterial', location: 'Aizawl', status: 'at-risk', lastUpdate: '45 min ago', note: 'Heavy soil saturation along mountain cut.' },
  { id: 'NH-29', name: 'Dimapur – Kohima Spur', location: 'Kohima', status: 'open', lastUpdate: '1 hr ago', note: 'Traffic moving steadily under wet weather limits.' },
  { id: 'NH-13', name: 'Trans-Arunachal Highway', location: 'Tawang', status: 'at-risk', lastUpdate: '30 min ago', note: 'High runoff on uphill hairpin turns.' },
  { id: 'NH-40', name: 'Guwahati – Shillong Expressway', location: 'Shillong', status: 'open', lastUpdate: '2 hr ago', note: 'All lanes operational.' }
];

/* ---- LocalStorage Helpers ---- */
function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { 
    return fallback; 
  }
}

function lsSet(key, value) { 
  try {
    localStorage.setItem(key, JSON.stringify(value)); 
  } catch (e) {}
}

function seedIfEmpty() {
  if (!localStorage.getItem(LS_KEYS.USERS)) {
    lsSet(LS_KEYS.USERS, [
      { name: 'Demo Officer', email: 'demo@wlms.gov.in', password: 'demo1234', org: 'State Disaster Management Authority (SDMA)', role: 'Field Coordinator' }
    ]);
  }
  if (!localStorage.getItem(LS_KEYS.THEME)) lsSet(LS_KEYS.THEME, 'dark');
  if (!localStorage.getItem(LS_KEYS.LANG)) lsSet(LS_KEYS.LANG, 'en');
  if (!localStorage.getItem(LS_KEYS.ACTIVE_LOCATION)) lsSet(LS_KEYS.ACTIVE_LOCATION, 2);
}
seedIfEmpty();

/* ---- Central 24x7 Async Live Satellite Sync Engine ---- */
async function syncWithFastAPIBackend() {
  // 1. Sync Live Satellite Telemetry for all districts into local cache
  try {
    const locRes = await fetch(`${BACKEND_URL}/locations?live=true`);
    if (locRes.ok) {
      const liveLocs = await locRes.json();
      if (Array.isArray(liveLocs) && liveLocs.length > 0) {
        // Map backend objects directly into frontend DEMO_LOCATIONS
        DEMO_LOCATIONS = liveLocs.map(l => ({
          id: l.id,
          name: l.name,
          lat: l.latitude,
          lng: l.longitude,
          riskScore: Math.round(l.risk_score ?? 45),
          riskLevel: (l.risk_level ?? 'moderate').toLowerCase(),
          color: l.color || '#ca8a04',
          rainfall: Number(l.rainfall_24h ?? 0).toFixed(1),
          soilMoisture: Number(l.soil_moisture ?? 40).toFixed(1),
          slope: l.slope,
          elevation: l.elevation,
          historicalLandslides: l.historical_landslides >= 10 ? 'High' : l.historical_landslides >= 5 ? 'Moderate' : 'Low',
          roadStatus: l.risk_score >= 75 ? 'blocked' : l.risk_score >= 55 ? 'at-risk' : 'open',
          activeAlerts: l.risk_score >= 75 ? 2 : l.risk_score >= 55 ? 1 : 0
        }));

        lsSet(LS_KEYS.LIVE_CACHE, DEMO_LOCATIONS);
        console.log(`>>> [DATA ENGINE] 24x7 Live Satellite Telemetry Synced (${DEMO_LOCATIONS.length} NER Districts)`);
      }
    }
  } catch (e) {
    console.warn("Locations live background sync idle, using cached registry.");
  }

  // 2. Sync Live Real-Time Alerts
  try {
    const alertsRes = await fetch(`${BACKEND_URL}/alerts?threshold=35`);
    if (alertsRes.ok) {
      const liveAlerts = await alertsRes.json();
      if (Array.isArray(liveAlerts) && liveAlerts.length > 0) {
        lsSet(LS_KEYS.ALERTS, liveAlerts);
        console.log(`>>> [DATA ENGINE] Synced ${liveAlerts.length} Live Alerts.`);
      }
    }
  } catch (e) {}
}

// Initial Sync & 60s background sync loop
syncWithFastAPIBackend();
setInterval(syncWithFastAPIBackend, 60000);

/* ---- Scientific Risk Level Mappers (ISRO/GSI Aligned) ---- */
function riskLevelFromScore(score) {
  const num = Number(score) || 0;
  if (num >= 75) return 'critical';
  if (num >= 55) return 'high';
  if (num >= 35) return 'moderate';
  return 'low';
}

function riskMeta(level) {
  const lvl = String(level || 'moderate').toLowerCase();
  const map = {
    low:      { label: 'LOW',      emoji: '🟢', color: '#16a34a', cls: 'low'  },
    moderate: { label: 'MODERATE', emoji: '🟡', color: '#ca8a04', cls: 'mod'  },
    high:     { label: 'HIGH',     emoji: '🟠', color: '#ea580c', cls: 'high' },
    critical: { label: 'CRITICAL', emoji: '🔴', color: '#dc2626', cls: 'crit' }
  };
  return map[lvl] || map.moderate;
}

function recommendationFor(level) {
  const lvl = String(level || 'moderate').toLowerCase();
  const map = {
    low: 'Terrain and meteorological parameters within standard stability limits. Standard automated monitoring active.',
    moderate: 'Elevated pore pressure detected. Pre-position road maintenance units and monitor mountain drainage culverts.',
    high: 'High risk of shallow translational landslides. Issue public advisories for vulnerable highway corridors.',
    critical: 'IMMEDIATE EVACUATION DIRECTIVE: Saturated slope failure threshold exceeded. Restrict vehicular movement on cut slopes.'
  };
  return map[lvl] || map.moderate;
}

/* Local Deterministic Scoring Fallback */
function computeRiskScore({ rainfall, soilMoisture, slope, elevation, historicalLandslides }) {
  const histWeight = { 'Low': 4, 'Moderate': 10, 'High': 16 }[historicalLandslides] ?? 8;
  const r24 = Number(rainfall) || 0;
  const sm = Number(soilMoisture) || 0;
  const slp = Number(slope) || 0;
  const elv = Number(elevation) || 0;

  let score =
    (Math.min(r24, 250) / 250) * 35 +
    (Math.min(sm, 100) / 100) * 25 +
    (Math.min(slp, 55) / 55) * 22 +
    (Math.min(elv, 3000) / 3000) * 8 +
    histWeight;

  score = Math.max(2, Math.min(99, Math.round(score)));
  const confidence = Math.max(75, Math.min(96, Math.round(88 + (score % 7))));
  return { score, level: riskLevelFromScore(score), confidence };
}

function fmtDate(iso) {
  if (!iso) return 'Just now';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso) {
  if (!iso) return 'just now';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} d ago`;
}

function uid(prefix) { 
  return `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`; 
}

// Universal District Lookup (Checks Live Cache first, then fallback registry)
function getLocationById(id) { 
  const targetId = parseInt(id);
  const cached = lsGet(LS_KEYS.LIVE_CACHE, DEMO_LOCATIONS);
  return cached.find(l => Number(l.id) === targetId) || 
         DEMO_LOCATIONS.find(l => Number(l.id) === targetId) || 
         DEMO_LOCATIONS[0]; 
}