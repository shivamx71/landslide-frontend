/* =========================================================
   risk-analysis.js — Integrated with FastAPI Backend Engine
   ========================================================= */

initShell({ active: 'risk-analysis.html', title: 'Risk Analysis', crumb: 'Monitor / Risk Analysis' });

// Prefill from query param location, if present
(function prefillFromQuery(){
  const params = new URLSearchParams(window.location.search);
  const locId = params.get('loc');
  if (locId){
    const loc = getLocationById(locId);
    document.getElementById('in-location').value = loc.name;
    document.getElementById('in-rainfall').value = loc.rainfall;
    document.getElementById('in-soil').value = loc.soilMoisture;
    document.getElementById('in-slope').value = loc.slope;
    document.getElementById('in-elevation').value = loc.elevation;
    document.getElementById('in-history').value = loc.historicalLandslides;
  }
})();

function setRAneedle(score){
  const angle = -90 + (score/100)*180;
  document.getElementById('ra-needle').style.transform = `rotate(${angle}deg)`;
}

document.getElementById('risk-form').addEventListener('submit', async function(e){
  e.preventDefault();
  const locationName = document.getElementById('in-location').value.trim() || 'Unnamed location';
  const inputs = {
    rainfall: Number(document.getElementById('in-rainfall').value),
    soilMoisture: Number(document.getElementById('in-soil').value),
    slope: Number(document.getElementById('in-slope').value),
    elevation: Number(document.getElementById('in-elevation').value),
    historicalLandslides: document.getElementById('in-history').value
  };

  let result;
  let dataSource = "FastAPI AI Engine";

  // ---------------- FASTAPI ML MODEL INTEGRATION ----------------
  try {
    const histMap = { 'Low': 2, 'Moderate': 6, 'High': 12 };
    const histVal = typeof inputs.historicalLandslides === 'number'
      ? inputs.historicalLandslides
      : (histMap[inputs.historicalLandslides] || 6);

    const response = await fetch(`${BACKEND_URL}/predict`, {
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
        score: data.risk_score,
        level: data.risk_level.toLowerCase(),
        confidence: Math.round(75 + (data.risk_score / 100) * 20)
      };
      console.log(">>> [FASTAPI] AI Risk Prediction received from Backend:", result);
    } else {
      throw new Error("Backend response not OK");
    }
  } catch (err) {
    console.warn(">>> [FALLBACK] Backend unreachable, using local heuristic model:", err);
    result = computeRiskScore(inputs);
    dataSource = "Local Fallback Engine";
  }
  // ---------------------------------------------------------------

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

  // persist analysis record
  const analyses = lsGet(LS_KEYS.ANALYSES, []);
  analyses.unshift({ id: uid('AN'), location: locationName, ...inputs, ...result, ranAt: new Date().toISOString() });
  lsSet(LS_KEYS.ANALYSES, analyses.slice(0, 50));

  const alertNote = document.getElementById('ra-alert-note');
  if (result.level === 'high' || result.level === 'critical'){
    const alerts = lsGet(LS_KEYS.ALERTS, []);
    alerts.unshift({
      id: uid('AL'),
      location: locationName,
      title: result.level === 'critical' ? 'LANDSLIDE WARNING' : 'ELEVATED RISK ADVISORY',
      message: result.level === 'critical'
        ? 'High-risk conditions detected. Saturated slope, rainfall and terrain factors indicate imminent landslide hazard.'
        : 'Rising environmental readings indicate an elevated landslide risk requiring closer observation.',
      riskScore: result.score,
      severity: result.level,
      createdAt: new Date().toISOString(),
      status: 'active'
    });
    lsSet(LS_KEYS.ALERTS, alerts);
    alertNote.style.display = 'block';
    alertNote.innerHTML = `⚠️ <b>Alert automatically generated</b> — a ${result.level.toUpperCase()} severity alert for ${locationName} has been logged to the system.`;
    toast('New ' + result.level.toUpperCase() + ' alert generated for ' + locationName, 'warn');
  } else {
    alertNote.style.display = 'none';
  }

  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});