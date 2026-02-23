// ÄNDRA denna senare till din deployade URL när du publicerar backend:
const API_BASE = "http://localhost:3000";

const leaveInput = document.getElementById("leaveTime");
const statusEl = document.getElementById("status");

document.addEventListener("DOMContentLoaded", async () => {
  // 1) Ladda sparad tid om den finns
  chrome.storage.sync.get(["leaveTime"], (r) => {
    if (r.leaveTime) leaveInput.value = r.leaveTime;
  });

  // 2) Hämta väder och rendera
  await loadWeather(); // Tema + median
const todaysTemps = todaysTempsFromForecast(forecast);
if (todaysTemps.length > 0) {
const med = median(todaysTemps);
document.getElementById("medianLabel").textContent = `DAY MEDIAN: ${Math.round(med)}°`;
applyThemeByTemp(Math.round(med));
} else {
applyThemeByTemp(temp); // fallback på nuvarande temp
}

  // 3) Spara-knapp
  document.getElementById("saveBtn").addEventListener("click", () => saveAndSchedule());

  // 4) Testnotis
  document.getElementById("testBtn").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "testNotification" });
  });
});

async function loadWeather() {
  statusEl.textContent = "Hämtar väder…";
  try {
    const res = await fetch(`${API_BASE}/weather`);
    const data = await res.json();

    const current = data.current;
    const forecast = data.forecast?.list || [];

    // UI
    const temp = Math.round(current.main.temp);
    document.getElementById("temp").textContent = `${temp}°`;
    document.getElementById("desc").textContent = current.weather[0].description.toUpperCase();

    document.getElementById("feels").textContent = `${Math.round(current.main.feels_like)}°`;
    document.getElementById("wind").textContent = `${current.wind.speed} m/s`;
    document.getElementById("humidity").textContent = `${current.main.humidity}%`;

    const sunrise = new Date(current.sys.sunrise * 1000);
    const sunset = new Date(current.sys.sunset * 1000);
    document.getElementById("sunrise").textContent = sunrise.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
    document.getElementById("sunset").textContent = sunset.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });

    // Klädråd (baserat på dagens temp)
    document.getElementById("clothing").textContent = clothingAdvice(temp);

    // Timrad (5 kommande steg)
    renderHourly(forecast);

    statusEl.textContent = "Uppdaterad.";
  } catch (e) {
    console.error(e);
    statusEl.textContent = "Kunde inte hämta väder (kolla att backend kör).";
  }
}

function renderHourly(list) {
  const el = document.getElementById("hourly");
  el.innerHTML = "";

  list.slice(0, 5).forEach(item => {
    const t = new Date(item.dt * 1000);
    const hour = t.getHours().toString().padStart(2, "0");
    const icon = item.weather?.[0]?.icon;

    const div = document.createElement("div");
    div.className = "hour";
    div.innerHTML = `
      <div>${hour}:00</div>
      <img src="https://openweathermap.org/img/wn/${icon}.png" alt="">
      <div>${Math.round(item.main.temp)}°</div>
    `;
    el.appendChild(div);
  });
}

function clothingAdvice(temp) {
  if (temp <= -15) return "Ullunderställ (merino) + tjock ulltröja/fleece + rejäl dunparkas. Ullstrumpor + varmfodrade kängor. Mössa som täcker öron, tumvantar, halsduk/buff.";
  if (temp <= -10) return "Tunnare ullunderställ/långärmad tröja + fleece/stickat + varm vinterjacka. Boots. Mössa & vantar (halsduk vid blåst).";
  if (temp <= -5)  return "Långärmad tröja/tunn stickad + dunjacka/vadderad. Vanliga byxor (tunn långkalsong vid behov). Vattentåliga boots.";
  if (temp <= 0)   return "T-shirt + stickad tröja + mellantjock jacka (lätt dun/fodrad). Boots/sneakers med lite tjockare strumpor. Lätt halsduk vid behov.";
  if (temp <= 5)   return "T-shirt + tunn stickad. Lätt dunjacka/ullkappa/tunn jacka. Sneakers/boots. Tunn halsduk om det blåser.";
  if (temp <= 10)  return "T-shirt + lätt jacka (jeansjacka/trench/bomber). Sneakers. Oftast inga accessoarer.";
  return "Milt: t-shirt eller tunn jacka räcker ofta ☀️";
}

function saveAndSchedule() {
  const leaveTime = leaveInput.value;
  if (!leaveTime) {
    statusEl.textContent = "Välj en tid först.";
    return;
  }

  chrome.storage.sync.set({ leaveTime }, () => {
    chrome.runtime.sendMessage({ action: "scheduleAlarm", leaveTime }, () => {
      statusEl.textContent = `Sparat. Notis 10 min innan ${leaveTime}.`;
    });
  });
}
function median(nums) {
  const arr = nums.slice().sort((a,b)=>a-b);
  const mid = Math.floor(arr.length/2);
  return arr.length % 2 ? arr[mid] : (arr[mid-1] + arr[mid]) / 2;
}

function todaysTempsFromForecast(forecastList) {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();

  return forecastList
    .filter(item => {
      const dt = new Date(item.dt * 1000);
      return dt.getFullYear()===y && dt.getMonth()===m && dt.getDate()===d;
    })
    .map(item => item.main.temp);
}

function applyThemeByTemp(t) {
  document.body.classList.remove("cold","mild","warm");
  if (t <= 0) document.body.classList.add("cold");
  else if (t <= 12) document.body.classList.add("mild");
  else document.body.classList.add("warm");

  const badge = document.getElementById("tempBadge");
  badge.textContent = t <= 0 ? "COLD DAY" : (t <= 12 ? "MILD DAY" : "WARM DAY");
}