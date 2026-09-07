/* =========================================================
   risk-analysis.js — Realtime AI Landslide Prediction Engine
   ========================================================= */

initShell({ active: 'risk-analysis.html', title: 'Risk Analysis', crumb: 'Monitor / Risk Analysis' });

const API_BASE = typeof BACKEND_URL !== 'undefined' ? BACKEND_URL : "https://sih-landslide-backend-kzl9.onrender.com";

// District Geotechnical Baseline Presets (User ko number dhundne na padein)
const DISTRICT_PRESETS = {
  'east-sikkim': { name: 'East Sikkim', rain: 182, soil: 78, slope: 36, elev: 1850, hist: 'High' },
  'gangtok':     { name: 'Gangtok',     rain: 121, soil: 61, slope: 27, elev: 1650, hist: 'Moderate' },
  'aizawl':      { name: 'Aizawl',      rain: 143, soil: 69, slope: 31, elev: 1132, hist: 'High' },
  'kohima':      { name: 'Kohima',      rain: 132, soil: 70, slope: 29, elev: 1444, hist: 'Moderate' },
  'shillong':    { name: 'Shillong',    rain: 96,  soil: 52, slope: 22, elev: 1496, hist: 'Low' }
};

// Form mein automatically values bharne ka helper
function autoFillInputs(presetKey) {
  const p = DISTRICT_PRESETS[presetKey] || DISTRICT_PRESETS['east-sikkim'];
  
  if (document.getElementById('in-location')) document.getElementById('in-location').value = p.name;
  if (document.getElementById('in-rainfall')) document.getElementById('in-rainfall').value = p.rain;
  if (document.getElementById('in-soil')) document.getElementById('in-soil').value = p.soil;
  if (document.getElementById('in-slope')) document.getElementById('in-slope').value = p.slope;
  if (document.getElementById('in-elevation')) document.getElementById('in-elevation').value = p.elev;
  if (document.getElementById('in-history')) document.getElementById('in-history').value = p.hist;
}

// 1. Initial Auto-Fill: Page khulte hi default values khud bhar jayengi
(function initAutoFill(){
  const params = new URLSearchParams(window.location.search);
  const locId = params.get('loc') || 'east-sikkim';
  autoFillInputs(locId);
})();

function setRAneedle(score){
  const angle = -90 + (score/100)*180;
  const needle = document.getElementById('ra-needle');
  if (needle) needle.style.transform = `rotate(${angle}deg)`;
}

// 2. FORM SUBMISSION -> FASTAPI ML MODEL (/predict)
document.getElementById('risk-form').addEventListener('submit', async function(e){
  e.preventDefault();
  
  const locationName = document.getElementById('in-location').value.trim() || 'Custom Sector';
  const inputs = {
    rainfall: Number(document.getElementById('in-rainfall').value) || 100,
    soilMoisture: Number(document.getElementById('in-soil').value) || 50,
    slope: Number(document.getElementById('in-slope').value) || 25,
    elevation: Number(document.getElementById('in-elevation').value) || 1200,
    historicalLandslides: document.getElementById('in-history').value || 'Moderate'
  };

  let result;
  let dataSource = "SIH FastAPI ML Model";

  try {
    const histMap = { 'Low': 2, 'Moderate': 6, 'High': 12 };
    const histVal = typeof inputs.historicalLandslides === 'number'
      ? inputs.historicalLandslides
      : (histMap[inputs.historicalLandslides] || 6);

    // Call FastAPI /predict endpoint
    const response = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rainfall_24h: inputs.rainfall,
        rainfall_7d: inputs.rainfall * 2.6,
        soil_moisture: inputs.soilMoisture,
        slope: inputs.slope,
        elevation: inputs.elevation,
        historical_landslides: histVal
      })
    });

    if (response.ok) {
      const data = await response.json();
      result = {
        score: Math.round(data.risk_score),
        level: (data.risk_level || 'moderate').toLowerCase(),
        confidence: Math.round(75 + (data.risk_score / 100) * 20)
      };
      console.log(">>> [FASTAPI ML MODEL] Prediction Success:", result);
    } else {
      throw new Error("Backend response error");
    }
  } catch (err) {
    console.warn("Using fallback heuristic engine:", err);
    result = computeRiskScore(inputs);
    dataSource = "Local Fallback Engine";
  }

  const rm = riskMeta(result.level);

  document.getElementById('placeholder-panel').style.display = 'none';
  const panel = document.getElementById('result-panel');
  panel.style.display = 'block';
  document.getElementById('result-time').textContent = new Date().toLocaleTimeString() + ` (${dataSource})`;
  document.getElementById('ra-score').textContent = result.score;
  document.getElementById('ra-badge').className = 'badge badge-' + rm.cls;
  document.getElementById('ra-badge').innerHTML = `<span class="badge-dot"></span> ${rm.emoji} ${rm.label}`;
  document.getElementById('ra-confidence').textContent = result.confidence + '%';
  document.getElementById('ra-location').textContent = locationName;
  document.getElementById('ra-recommendation').textContent = recommendationFor(result.level);
  
  setTimeout(() => setRAneedle(result.score), 100);

  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
