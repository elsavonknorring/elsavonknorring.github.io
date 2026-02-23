import express from "express";

const app = express();
const PORT = 3000;

const API_KEY = "44ec43679c6dc3f3ce6a358ef0ac0640";

// serverar index.html i samma mapp
app.use(express.static("."));

app.get("/weather", async (req, res) => {
  const lat = 59.3293;   // Stockholm
  const lon = 18.0686;

  const currentUrl =
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=sv&appid=${API_KEY}`;

  const forecastUrl =
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=sv&appid=${API_KEY}`;

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(currentUrl),
      fetch(forecastUrl)
    ]);

    const current = await currentRes.json();
    const forecast = await forecastRes.json();

    // Om API-key är fel / annat error, skicka vidare tydligt
    if (current.cod && Number(current.cod) !== 200) return res.status(500).json(current);
    if (forecast.cod && String(forecast.cod) !== "200") return res.status(500).json(forecast);

    res.json({ current, forecast });
  } catch (e) {
    res.status(500).json({ error: "Kunde inte hämta väderdata" });
  }
});

app.listen(PORT, () => console.log("Server körs på http://localhost:3000"));
function renderIcon(weatherMain) {
  const container = document.getElementById("weatherIcon");
  container.innerHTML = "";

  if (weatherMain === "Clear") {
    container.innerHTML = '<div class="sun" style="position:relative;width:80px;height:80px;"></div>';
  }

  if (weatherMain === "Clouds") {
    container.innerHTML = '<div class="cloud" style="position:relative;margin:0 auto;"></div>';
  }

  if (weatherMain === "Rain") {
    container.innerHTML = '<div class="cloud" style="position:relative;margin:0 auto;"></div>';
  }
}


