const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;


const staticFolder = path.join(__dirname, 'app');
app.use(express.static(staticFolder));


// Weather proxy endpoint
app.get('/api/weather', async (req, res) => {
try {
const city = req.query.city || 'Delhi';
const apiKey = process.env.OPENWEATHER_API_KEY;
if (!apiKey) return res.status(500).json({ error: 'OPENWEATHER_API_KEY not set in environment' });


const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
const resp = await fetch(url);
if (!resp.ok) return res.status(resp.status).json({ error: 'Weather API error' });
const data = await resp.json();
res.json(data);
} catch (err) {
console.error(err);
res.status(500).json({ error: 'Server error' });
}
});


app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));