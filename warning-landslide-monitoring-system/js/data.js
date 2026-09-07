/* =========================================================
   data.js — Dataset & FastAPI Backend Persistence Layer
   Warning and Landslide Monitoring System (Full-Stack Mode)
   ========================================================= */

// Global Backend URL (Clean Render URL)
const BACKEND_URL = 'https://sih-landslide-backend-kzl9.onrender.com';

const LS_KEYS = {
  USERS: 'wlms_users',
  SESSION: 'wlms_session',
  REPORTS: 'wlms_field_reports',
  ALERTS: 'wlms_alerts',
  THEME: 'wlms_theme',
  LANG: 'wlms_lang',
  ANALYSES: 'wlms_analyses',
  ACTIVE_LOCATION: 'wlms_active_location'
};

/* ---- Demo monitoring locations (seed / cached API data) ---- */
let DEMO_LOCATIONS = [
  {
    id: 1, name: 'East Sikkim', state: 'Sikkim', region: 'Eastern Himalaya',
    lat: 27.3389, lng: 88.6065,
    riskScore: 87, riskLevel: 'critical',
    rainfall: 182, soilMoisture: 78, slope: 36, elevation: 1850, historicalLandslides: 'High',
    roadStatus: 'blocked', activeAlerts: 2, confidence: 92
  },
  {
    id: 2, name: 'Gangtok', state: 'Sikkim', region: 'Eastern Himalaya',
    lat: 27.3314, lng: 88.6138,
    riskScore: 58, riskLevel: 'high',
    rainfall: 121, soilMoisture: 61, slope: 27, elevation: 1650, historicalLandslides: 'Moderate',
    roadStatus: 'at-risk', activeAlerts: 1, confidence: 84
  },
  {
    id: 3, name: 'Aizawl', state: 'Mizoram', region: 'North-East Hills',
    lat: 23.7271, lng: 92.7176,
    riskScore: 64, riskLevel: 'high',
    rainfall: 143, soilMoisture: 69, slope: 31, elevation: 1132, historicalLandslides: 'High',
    roadStatus: 'at-risk', activeAlerts: 1, confidence: 88
  },
  {
    id: 4, name: 'Kohima', state: 'Nagaland', region: 'North-East Hills',
    lat: 25.6751, lng: 94.1086,
    riskScore: 61, riskLevel: 'high',
    rainfall: 132, soilMoisture: 66, slope: 29, elevation: 1444, historicalLandslides: 'Moderate',
    roadStatus: 'open', activeAlerts: 1, confidence: 81
  },
  {
    id: 5, name: 'Shillong', state: 'Meghalaya', region: 'North-East Hills',
    lat: 25.5788, lng: 91.8933,
    riskScore: 42, riskLevel: 'moderate',
    rainfall: 96, soilMoisture: 52, slope: 22, elevation: 1496, historicalLandslides: 'Moderate',
    roadStatus: 'open', activeAlerts: 0, confidence: 77
  }
];

const EMERGENCY_CENTERS = [
  { name: 'East Sikkim Disaster Response Unit', lat: 27.3421, lng: 88.6201 },
  { name: 'Gangtok Emergency Command Post', lat: 27.3289, lng: 88.6091 },
  { name: 'Aizawl Civil Defence Center', lat: 23.7305, lng: 92.7220 },
  { name: 'Kohima Rescue Coordination Cell', lat: 25.6789, lng: 94.1120 },
  { name: 'Shillong Relief Station', lat: 25.5820, lng: 91.8890 }
];

const HISTORICAL_LANDSLIDES = [
  { year: 2019, location: 'East Sikkim', severity: 'High', deaths: 7, roadsBlocked: 3 },
  { year: 2019, location: 'Aizawl', severity: 'Moderate', deaths: 1, roadsBlocked: 1 },
  { year: 2020, location: 'Gangtok', severity: 'Moderate', deaths: 0, roadsBlocked: 2 },
  { year: 2020, location: 'Shillong', severity: 'Low', deaths: 0, roadsBlocked: 1 },
  { year: 2021, location: 'East Sikkim', severity: 'Critical', deaths: 12, roadsBlocked: 5 },
  { year: 2021, location: 'Kohima', severity: 'Moderate', deaths: 2, roadsBlocked: 1 },
  { year: 2022, location: 'Aizawl', severity: 'High', deaths: 4, roadsBlocked: 2 },
  { year: 2022, location: 'East Sikkim', severity: 'High', deaths: 3, roadsBlocked: 2 },
  { year: 2023, location: 'Gangtok', severity: 'Critical', deaths: 9, roadsBlocked: 4 },
  { year: 2023, location: 'Shillong', severity: 'Moderate', deaths: 1, roadsBlocked: 1 },
  { year: 2024, location: 'Kohima', severity: 'High', deaths: 3, roadsBlocked: 2 },
  { year: 2024, location: 'East Sikkim', severity: 'Critical', deaths: 15, roadsBlocked: 6 },
  { year: 2025, location: 'Aizawl', severity: 'Moderate', deaths: 0, roadsBlocked: 1 },
  { year: 2025, location: 'East Sikkim', severity: 'High', deaths: 5, roadsBlocked: 3 }
];

const ROAD_SEGMENTS = [
  { id: 'NH10-A', name: 'NH-10 Gangtok — East Sikkim Link', location: 'East Sikkim', status: 'blocked', lastUpdate: '18 min ago', note: 'Debris flow across carriageway near Km 42.' },
  { id: 'SH-1B', name: 'Rongli — Rhenock Road', location: 'East Sikkim', status: 'blocked', lastUpdate: '41 min ago', note: 'Slope failure, single lane closed.' },
  { id: 'NH-40', name: 'Aizawl — Sairang Highway', location: 'Aizawl', status: 'at-risk', lastUpdate: '1 hr ago', note: 'Cracking observed on retaining wall.' },
  { id: 'NH-2', name: 'Kohima Bypass', location: 'Kohima', status: 'at-risk', lastUpdate: '2 hr ago', note: 'Saturated slope above carriageway.' },
  { id: 'GTK-04', name: 'Gangtok Ring Road', location: 'Gangtok', status: 'open', lastUpdate: '3 hr ago', note: 'Monitoring continues, no obstruction.' },
  { id: 'SHL-09', name: 'Shillong — Cherrapunji Road', location: 'Shillong', status: 'open', lastUpdate: '4 hr ago', note: 'Routine patrol clear.' },
  { id: 'NH-6', name: 'Shillong Approach Road', location: 'Shillong', status: 'open', lastUpdate: '5 hr ago', note: 'No anomalies detected.' },
  { id: 'KHM-11', name: 'Kohima — Dimapur Road', location: 'Kohima', status: 'open', lastUpdate: '6 hr ago', note: 'Clear, light traffic.' },
  { id: 'AIZ-07', name: 'Aizawl City Link Road', location: 'Aizawl', status: 'open', lastUpdate: '2 hr ago', note: 'Clear.' },
  { id: 'ESK-02', name: 'Pakyong Feeder Road', location: 'East Sikkim', status: 'at-risk', lastUpdate: '55 min ago', note: 'Minor subsidence, escort advised.' }
];

/* ---- LocalStorage helpers ---- */
function lsGet(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  }catch(e){ return fallback; }
}
function lsSet(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

function seedIfEmpty(){
  if (!localStorage.getItem(LS_KEYS.USERS)){
    lsSet(LS_KEYS.USERS, [
      { name: 'Demo Officer', email: 'demo@wlms.gov.in', password: 'demo1234', org: 'State Disaster Management Authority', role: 'Field Coordinator' }
    ]);
  }
  if (!localStorage.getItem(LS_KEYS.REPORTS)){
    lsSet(LS_KEYS.REPORTS, [
      {
        id: 'FR-1001', location: 'East Sikkim', lat: 27.3401, lng: 88.6120,
        type: 'Slope Movement', description: 'Visible tilting of trees and minor soil creep observed along the ridge above the settlement.',
        photo: null, submittedAt: '2026-09-04T09:12:00', status: 'Reviewed'
      },
      {
        id: 'FR-1002', location: 'Aizawl', lat: 23.7290, lng: 92.7155,
        type: 'Crack', description: 'New surface crack, approx. 6m long, spotted along the retaining wall near the highway.',
        photo: null, submittedAt: '2026-09-04T11:40:00', status: 'Pending'
      }
    ]);
  }
  if (!localStorage.getItem(LS_KEYS.ALERTS)){
    lsSet(LS_KEYS.ALERTS, [
      {
        id: 'AL-9001', location: 'East Sikkim', title: 'LANDSLIDE WARNING',
        message: 'High-risk conditions detected. Saturated slope, heavy rainfall persisting over 24h.',
        riskScore: 87, severity: 'critical', createdAt: '2026-09-05T06:20:00', status: 'active'
      },
      {
        id: 'AL-9002', location: 'Aizawl', title: 'ELEVATED RISK ADVISORY',
        message: 'Rising soil moisture and slope angle indicate elevated landslide susceptibility.',
        riskScore: 64, severity: 'high', createdAt: '2026-09-05T05:05:00', status: 'active'
      },
      {
        id: 'AL-9003', location: 'Kohima', title: 'ELEVATED RISK ADVISORY',
        message: 'Continuous rainfall over the past 18 hours has raised local risk levels.',
        riskScore: 61, severity: 'high', createdAt: '2026-09-04T22:48:00', status: 'active'
      }
    ]);
  }
  if (!localStorage.getItem(LS_KEYS.THEME)) lsSet(LS_KEYS.THEME, 'dark');
  if (!localStorage.getItem(LS_KEYS.LANG)) lsSet(LS_KEYS.LANG, 'en');
  if (!localStorage.getItem(LS_KEYS.ACTIVE_LOCATION)) lsSet(LS_KEYS.ACTIVE_LOCATION, 1);
}
seedIfEmpty();

/* ---- Async Live Backend Sync Engine ---- */
async function syncWithFastAPIBackend() {
  try {
    const alertsRes = await fetch(`${BACKEND_URL}/alerts`);
    if (alertsRes.ok) {
      const liveAlerts = await alertsRes.json();
      if (liveAlerts && Array.isArray(liveAlerts) && liveAlerts.length > 0) {
        const mappedAlerts = liveAlerts.map((a, i) => ({
          id: `AL-LIVE-${i + 1}`,
          location: a.location || 'NER Zone',
          title: (a.severity || '').toUpperCase() === 'CRITICAL' ? 'LANDSLIDE WARNING' : 'ELEVATED RISK ADVISORY',
          message: a.message || 'Risk conditions updated.',
          riskScore: a.risk_score || 70,
          severity: (a.severity || 'high').toLowerCase(),
          createdAt: new Date().toISOString(),
          status: 'active'
        }));
        lsSet(LS_KEYS.ALERTS, mappedAlerts);
        console.log(">>> [FASTAPI] Live Critical Alerts synced into LocalStorage:", mappedAlerts.length);
      }
    }
  } catch (e) {
    console.warn(">>> [FASTAPI] Live backend sync idle (using cached defaults):", e);
  }
}
syncWithFastAPIBackend();

/* ---- Risk helpers (shared across pages) ---- */
function riskLevelFromScore(score){
  if (score <= 25) return 'low';
  if (score <= 50) return 'moderate';
  if (score <= 75) return 'high';
  return 'critical';
}
function riskMeta(level){
  const map = {
    low:      { label: 'LOW',      emoji: '🟢', color: 'var(--risk-low)',  cls: 'low'  },
    moderate: { label: 'MODERATE', emoji: '🟡', color: 'var(--risk-mod)',  cls: 'mod'  },
    high:     { label: 'HIGH',     emoji: '🟠', color: 'var(--risk-high)', cls: 'high' },
    critical: { label: 'CRITICAL', emoji: '🔴', color: 'var(--risk-crit)', cls: 'crit' }
  };
  return map[level] || map.low;
}
function recommendationFor(level){
  const map = {
    low: 'Conditions are stable. Continue routine monitoring.',
    moderate: 'Increase observation frequency. Inform local road authorities.',
    high: 'Deploy field teams for inspection. Prepare community advisory.',
    critical: 'Immediate monitoring required. Alert emergency services and consider evacuation readiness.'
  };
  return map[level] || map.low;
}

/* Local Deterministic Scoring Engine (Fallback) */
function computeRiskScore({ rainfall, soilMoisture, slope, elevation, historicalLandslides }){
  const histWeight = { 'Low': 4, 'Moderate': 10, 'High': 16 }[historicalLandslides] ?? 8;
  let score =
    (rainfall / 250) * 34 +
    (soilMoisture / 100) * 26 +
    (slope / 60) * 22 +
    (elevation / 3000) * 8 +
    histWeight;
  score = Math.max(2, Math.min(99, Math.round(score)));
  const confidence = Math.max(65, Math.min(97, Math.round(70 + (score / 100) * 25 - Math.random() * 3)));
  return { score, level: riskLevelFromScore(score), confidence };
}

function fmtDate(iso){
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
}
function timeAgo(iso){
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff/60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + ' min ago';
  const hrs = Math.floor(mins/60);
  if (hrs < 24) return hrs + ' hr ago';
  return Math.floor(hrs/24) + ' d ago';
}
function uid(prefix){ return prefix + '-' + Math.random().toString(36).slice(2,7).toUpperCase(); }

function getLocationById(id){ 
  return DEMO_LOCATIONS.find(l => String(l.id) === String(id)) || DEMO_LOCATIONS[0]; 
}