const API_BASE = "http://localhost:3000";

console.log("Background file loaded");

chrome.runtime.onMessage.addListener((request) => {

  if (request.action === "scheduleAlarm") {
    scheduleNotification(request.leaveTime);
  }

  if (request.action === "testNotification") {
    showNotification("Test", "Detta är en testnotis.");
  }
});

function scheduleNotification(leaveTime) {
  const [hour, minute] = leaveTime.split(":").map(Number);

  const now = new Date();
  const alarmTime = new Date();

 
 alarmTime.setHours(hour, minute, 0, 0);
alarmTime.setTime(alarmTime.getTime() - 10 * 60 * 1000); // subtrahera 10 min i ms
if (alarmTime <= now) {
alarmTime.setDate(alarmTime.getDate() + 1);
}


  if (alarmTime < now) {
    alarmTime.setDate(alarmTime.getDate() + 1);
  }

  chrome.alarms.clear("leaveReminder", () => {
    chrome.alarms.create("leaveReminder", {
when: alarmTime.getTime(),
periodInMinutes: 24 * 60 // upprepa varje 24h
});
  });

  console.log("Alarm satt till:", alarmTime);
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "leaveReminder") {
    console.log("ALARM TRIGGERED");
    await checkWeatherAndNotify();
    const cloudyToday = forecast.some(item => item.weather[0].main === "Clouds");

if (cloudyToday) {
  showNotification(
    "Molnigt idag ☁️",
    "Ta med en jacka — kan bli kyligt!"
  );
}
  }
});

async function checkWeatherAndNotify() {
  try {
   const res = await fetch(`${API_BASE}/weather`);
document.getElementById("temp").textContent = `${temp}°`;
    const data = await res.json();

    const forecast = data.forecast.list;

    const rainToday = forecast.some(item =>
      item.weather[0].main === "Rain"
    );

    const clearToday = forecast.some(item =>
      item.weather[0].main === "Clear"
    );

    if (rainToday) {
      showNotification("Glöm inte paraplyet ☔", "Det ska regna idag!");
    }

    if (clearToday) {
      showNotification("Soligt idag ☀️", "Ta med solglasögon!");
    }

  } catch (e) {
    console.error("Väderfel:", e);
  }
}

function showNotification(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon.png",
    title: title,
    message: message,
    priority: 2
  });
}