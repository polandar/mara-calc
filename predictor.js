/* =========================
   Constants (Enums)
   ========================= */

   const RaceCondition = {
    AVERAGE: 0,
    FAST: 1,
    DIFFICULT: 2
  };
  
  const RaceDistance = {
    FIVE_K: 0,
    FIVE_M: 1,
    TEN_K: 2,
    TEN_M: 3,
    HALF_MARA: 4
  };
  
  const adjustmentFactor = {
    0: { 1: -0.0237814322487082, 2: 0.1129432382020499 },
    1: { 1: -0.1549942921949754, 2: 0.1089566001045939 },
    2: { 1: -0.0780677777771365, 2: 0.024557694615445 },
    3: { 1: -0.1358099643292151, 2: 0.1030755530328555 },
    4: { 1: -0.0978322644420439, 2: 0.0335971859175381 }
  };
  
  const raceDistanceMeters = {
    0: 5000,
    1: 8045,
    2: 10000,
    3: 16090,
    4: 21098
  };
  
  /* =========================
     Helper functions
     ========================= */
  
  function parseTimeToSeconds(hms) {
    if (!hms) return null;
  
    const parts = hms.trim().split(":").map(Number);
    if (
      parts.length !== 3 ||
      parts.some(n => Number.isNaN(n)) ||
      parts[1] >= 60 ||
      parts[2] >= 60
    ) {
      return null;
    }
  
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  
  function formatMinutesToHMS(minutes) {
    const totalSeconds = Math.round(minutes * 60);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  
  function getCheckedRadioValue(name, defaultValue = null) {
    const el = document.querySelector(`input[name='${name}']:checked`);
    return el ? Number(el.value) : defaultValue;
  }
  
  /* =========================
     Predictor logic (Python → JS)
     ========================= */
  
  function getAdjustedTime(time, distance, conditions) {
    if (conditions === RaceCondition.AVERAGE) return time;
    const adj = adjustmentFactor[distance][conditions];
    const dist = raceDistanceMeters[distance];
    return dist / (dist / time + adj);
  }
  
  function singleRace(time, distance, conditions, mileage) {
    if (time === 0) return 0;
  
    const adjTime = getAdjustedTime(time, distance, conditions);
  
    const vRieg =
      42195 /
      (adjTime * Math.pow(42195 / raceDistanceMeters[distance], 1.07));
  
    const vModel =
      0.16018617 +
      0.83076202 * vRieg +
      0.06423826 * (mileage / 10);
  
    return (42195 / 60) / vModel;
  }
  
  function multiRace(time1, dist1, cond1, time2, dist2, cond2, mileage) {
    if (time1 === 0) return 0;
  
    let adj1 = getAdjustedTime(time1, dist1, cond1);
    let adj2 = getAdjustedTime(time2, dist2, cond2);
  
    // Ensure first race is longer
    if (raceDistanceMeters[dist1] < raceDistanceMeters[dist2]) {
      [time1, time2] = [time2, time1];
      [dist1, dist2] = [dist2, dist1];
      [cond1, cond2] = [cond2, cond1];
      adj1 = getAdjustedTime(time1, dist1, cond1);
      adj2 = getAdjustedTime(time2, dist2, cond2);
    }
  
    if (adj1 <= 0 || adj2 <= 0) {
      console.warn("One of the adjusted times is non-positive, returning 0");
      return 0;
    }
  
    const k = Math.log(adj2 / adj1) / Math.log(raceDistanceMeters[dist2] / raceDistanceMeters[dist1]);
    const kMara = 1.4510756 - 0.23797948 * k - 0.01410023 * mileage / 10;
    const rawPrediction = adj1 * Math.pow(42195 / raceDistanceMeters[dist1], kMara);
    const minutes = rawPrediction / 60;
  
    return minutes;
  }  
  
  /* =========================
     DOM wiring
     ========================= */
  
  const form = document.getElementById("predictorForm");
  const predictionDisplay = document.getElementById("predictionTime");

  const inputs = document.querySelectorAll("#predictorForm input");

inputs.forEach(input => {
  input.addEventListener("input", updatePrediction);
  input.addEventListener("change", updatePrediction);
});

  
function updatePrediction() {
    const mileage = Number(document.getElementById("mileage").value) || 0;
  
    // ---- Race 1 (required)
    const time1 = parseTimeToSeconds(document.getElementById("time1").value);
    if (time1 === null) {
      predictionDisplay.textContent = "0:00:00";
      return;
    }
  
    const dist1 = getCheckedRadioValue("dist1");
    const cond1 = getCheckedRadioValue("cond1");
    if (dist1 === null || cond1 === null) return;
  
    // ---- Race 2 (optional)
    const time2Input = document.getElementById("time2").value.trim();
    const time2 = time2Input ? parseTimeToSeconds(time2Input) : null;
    if (time2Input && time2 === null) {
      predictionDisplay.textContent = "0:00:00";
      return;
    }
  
    const dist2 = getCheckedRadioValue("dist2");
    const cond2 = getCheckedRadioValue("cond2", RaceCondition.AVERAGE);
  
    // ---- Compute
    let minutes;
    if (time2 !== null) {
      if (dist2 === null) return;
      minutes = multiRace(time1, dist1, cond1, time2, dist2, cond2, mileage);
    } else {
      minutes = singleRace(time1, dist1, cond1, mileage);
    }
  
    if (!Number.isFinite(minutes) || minutes <= 0) {
      predictionDisplay.textContent = "0:00:00";
      return;
    }
  
    predictionDisplay.textContent = formatMinutesToHMS(minutes);
  }
  
  