// routes/weather.js — Weather using Open-Meteo (free, no API key) + MongoDB cache
const express      = require("express");
const axios        = require("axios");
const WeatherCache = require("./model/WeatherCache");

const router     = express.Router();
const CACHE_MINS = 30;

const WMO_CODES = {
  0:  { desc: "Clear sky",        emoji: "☀️"  },
  1:  { desc: "Mainly clear",     emoji: "🌤️" },
  2:  { desc: "Partly cloudy",    emoji: "⛅"  },
  3:  { desc: "Overcast",         emoji: "☁️"  },
  45: { desc: "Foggy",            emoji: "🌫️" },
  48: { desc: "Icy fog",          emoji: "🌫️" },
  51: { desc: "Light drizzle",    emoji: "🌦️" },
  53: { desc: "Drizzle",          emoji: "🌦️" },
  55: { desc: "Heavy drizzle",    emoji: "🌧️" },
  61: { desc: "Slight rain",      emoji: "🌧️" },
  63: { desc: "Rain",             emoji: "🌧️" },
  65: { desc: "Heavy rain",       emoji: "🌧️" },
  71: { desc: "Slight snow",      emoji: "🌨️" },
  73: { desc: "Snow",             emoji: "🌨️" },
  75: { desc: "Heavy snow",       emoji: "❄️"  },
  80: { desc: "Rain showers",     emoji: "🌦️" },
  81: { desc: "Showers",          emoji: "🌧️" },
  82: { desc: "Violent showers",  emoji: "⛈️"  },
  95: { desc: "Thunderstorm",     emoji: "⛈️"  },
  96: { desc: "Thunderstorm",     emoji: "⛈️"  },
  99: { desc: "Thunderstorm",     emoji: "⛈️"  },
};

function wmo(code) { return WMO_CODES[code] || { desc: "Unknown", emoji: "🌡️" }; }

router.get("/", async (req, res) => {
  const city = (req.query.city || "Delhi").trim();

  try {
    // Check MongoDB cache
    const cached = await WeatherCache.findOne({ city: new RegExp(`^${city}$`, "i") });
    if (cached) {
      const ageMinutes = (Date.now() - new Date(cached.updatedAt).getTime()) / 60000;
      if (ageMinutes < CACHE_MINS) {
        return res.json({ success: true, source: "cache", weather: JSON.parse(cached.full_json) });
      }
    }

    // Geocode
    const geoRes = await axios.get(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
      { timeout: 8000 }
    );
    if (!geoRes.data.results?.length)
      return res.status(404).json({ success: false, message: `City "${city}" not found.` });

    const { latitude: lat, longitude: lon, name: resolvedCity, country } = geoRes.data.results[0];

    // Fetch weather
    const weatherRes = await axios.get(
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max` +
      `&timezone=auto&forecast_days=7`,
      { timeout: 8000 }
    );

    const cur   = weatherRes.data.current;
    const daily = weatherRes.data.daily;
    const temp  = Math.round(cur.temperature_2m);
    const humid = cur.relative_humidity_2m;
    const wind  = cur.wind_speed_10m;
    const wcode = cur.weather_code;

    let advisory = "🌱 Farming conditions are normal.";
    if (temp > 38)                       advisory = "⚠️ Severe heatwave — irrigate crops after sunset.";
    else if (temp > 35)                  advisory = "⚠️ Heatwave — irrigate after sunset, avoid midday fieldwork.";
    else if (wcode >= 95)                advisory = "⛈️ Thunderstorm — stay indoors, secure equipment.";
    else if (wcode >= 61 && wcode <= 67) advisory = "🌧️ Rain expected — delay harvesting and spraying.";
    else if (humid > 80)                 advisory = "⚠️ Very high humidity — high risk of fungal infections.";
    else if (humid > 70)                 advisory = "⚠️ High humidity — monitor crops for fungal disease.";
    else if (wind > 40)                  advisory = "⚠️ Strong winds — avoid pesticide spraying.";
    else if (temp < 5)                   advisory = "❄️ Cold weather — protect frost-sensitive crops.";

    const dailyForecast = daily.time.map((date, i) => ({
      date,
      temp_max:      Math.round(daily.temperature_2m_max[i]),
      temp_min:      Math.round(daily.temperature_2m_min[i]),
      description:   wmo(daily.weather_code[i]).desc,
      emoji:         wmo(daily.weather_code[i]).emoji,
      precipitation: daily.precipitation_sum[i] ?? 0,
      wind_max:      Math.round(daily.wind_speed_10m_max[i]),
    }));

    const weather = {
      city: resolvedCity, country,
      temperature: temp, feels_like: Math.round(cur.apparent_temperature),
      humidity: humid, wind: Math.round(wind),
      precipitation: cur.precipitation ?? 0,
      description: wmo(wcode).desc, emoji: wmo(wcode).emoji,
      risk_level: advisory, daily: dailyForecast,
      fetched_at: new Date().toISOString(),
    };

    // Upsert MongoDB cache
    await WeatherCache.findOneAndUpdate(
      { city: resolvedCity },
      { city: resolvedCity, temperature: String(temp), humidity: String(humid),
        wind: String(Math.round(wind)), risk_level: advisory, full_json: JSON.stringify(weather) },
      { upsert: true, new: true }
    );

    res.json({ success: true, source: "live", weather });
  } catch (err) {
    console.error("Weather error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch weather data." });
  }
});

module.exports = router;
