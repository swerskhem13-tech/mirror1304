(() => {
  const video          = document.getElementById('video');
  const canvas         = document.getElementById('canvas');
  const captureBtn     = document.getElementById('captureBtn');
  const idleText       = document.getElementById('idleText');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingLabel   = document.getElementById('loadingLabel');
  const responseOverlay= document.getElementById('responseOverlay');
  const responseText   = document.getElementById('responseText');
  const resetHint      = document.getElementById('resetHint');
  const cameraPrompt   = document.getElementById('cameraPrompt');
  const mirrorFrame    = document.getElementById('mirrorFrame');

  const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

  /* ── Build bulb strips ─────────────────────────────── */
  function makeBulbs(id, count) {
    const el = document.getElementById(id);
    for (let i = 0; i < count; i++) {
      const b = document.createElement('div');
      b.className = 'bulb';
      b.style.animationDelay = `${((i * 0.37) % 3.2).toFixed(2)}s`;
      el.appendChild(b);
    }
  }
  makeBulbs('leftBulbs', 16);
  makeBulbs('rightBulbs', 16);

  /* ── Camera ────────────────────────────────────────── */
  async function initCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false
      });
      video.srcObject = stream;
      video.addEventListener('loadedmetadata', () => {
        cameraPrompt.style.opacity = '0';
        setTimeout(() => cameraPrompt.style.display = 'none', 600);
      }, { once: true });
    } catch (err) {
      cameraPrompt.querySelector('p').innerHTML =
        'Camera access denied.<br><small>Allow permissions and refresh.</small>';
      console.error('Camera error:', err);
    }
  }

  /* ── State ─────────────────────────────────────────── */
  let appState = 'init';

  function setState(s) {
    appState = s;
    idleText.style.opacity   = s === 'idle' ? '' : '0';
    idleText.style.animation = s === 'idle' ? '' : 'none';
    loadingOverlay.classList.toggle('active', s === 'loading');
    responseOverlay.classList.toggle('visible', s === 'response');
    resetHint.classList.toggle('visible', s === 'response');
    captureBtn.disabled    = s === 'loading' || s === 'init';
    captureBtn.textContent = s === 'loading' ? 'The mirror gazes…' : 'Look into the Mirror';
    if (s === 'idle') responseText.innerHTML = '';
  }

  /* ── Compliment engine ─────────────────────────────── */
  const lines = {
    happy: [
      "Your smile carries a warmth that fills the room — it is entirely your own.",
      "That joy radiating from your face is a rare and beautiful thing. Wear it always.",
      "The light in your eyes when you smile is something truly captivating.",
      "Happiness looks extraordinary on you — your whole face comes alive with it.",
      "There is a genuine brightness about you right now that is impossible to ignore.",
      "Your smile is the kind that makes everyone around you feel a little lighter.",
      "That glow of happiness on your face is the most beautiful thing you could wear.",
      "You radiate a warmth that draws people in — and right now it is shining fully.",
    ],
    surprised: [
      "Your eyes hold a wonderful sense of wonder — open, alive, and deeply expressive.",
      "That look of curiosity suits you perfectly. There is a rare beauty in your openness.",
      "The way your face opens up with surprise is genuinely endearing.",
      "Your expressiveness is a gift — every emotion you feel is written beautifully.",
      "That wide-eyed wonder makes you look completely alive in this moment.",
      "There is something magnetic about the way you take the world in.",
    ],
    neutral: [
      "There is a quiet, composed elegance in your gaze that speaks without words.",
      "Your calm presence carries a natural grace that is genuinely captivating.",
      "You hold yourself with an effortless dignity that is timeless.",
      "There is a stillness about you that feels both grounded and magnetic.",
      "Your features carry a quiet confidence that needs no announcement.",
      "The way you simply exist in this moment is its own kind of beauty.",
      "There is depth behind your eyes that tells a story worth knowing.",
      "Your composure is striking — a rare kind of inner strength made visible.",
      "You have the kind of face that holds secrets and wisdom in equal measure.",
    ],
    sad: [
      "Even now, there is a gentle strength in your face that speaks of resilience.",
      "Your depth of feeling is written beautifully across your features. You are not alone.",
      "There is a tenderness in your expression that makes you profoundly human and beautiful.",
      "The sensitivity you carry is not a burden — it is one of your most striking qualities.",
      "Even in difficult moments, your face holds a quiet grace that is deeply moving.",
      "Your vulnerability is not weakness — it is a form of courage that shows in your eyes.",
      "There is something quietly powerful about the way you carry your feelings.",
    ],
    angry: [
      "The fire in your eyes is magnetic — that passion is a powerful part of who you are.",
      "Your intensity shows how deeply you care. That is something to be proud of.",
      "That fierce energy in your expression speaks of someone who stands for something.",
      "Your passion is written all over your face — and it is genuinely compelling.",
      "The strength in your gaze right now is formidable. Channel it well.",
      "There is a boldness in your expression that commands attention and respect.",
    ],
    fearful: [
      "Facing what unsettles you takes courage — and that courage shows in your face.",
      "Your sensitivity is not weakness. It is one of the most beautiful things about you.",
      "Even in uncertainty, there is a quiet bravery in the way you show up.",
      "The courage it takes to face your fears is written in your eyes right now.",
      "Your honesty with your own feelings is a rare and admirable quality.",
      "There is strength in acknowledging what scares you — and you are doing exactly that.",
    ],
    disgusted: [
      "Your discernment and high standards are written in your expression — that is admirable.",
      "You know your own mind. That self-awareness is a quiet kind of beauty.",
      "Your strong sense of what matters to you is something to be genuinely proud of.",
      "That clarity of conviction in your face speaks of someone with real integrity.",
      "Knowing what you will not accept is just as powerful as knowing what you want.",
      "Your standards say everything about your character — and they speak well of you.",
    ],
  };

  const ageLines = [
    [0,  20,  "You carry the whole world ahead of you — and you look ready for every bit of it."],
    [0,  20,  "There is a freshness and energy about you that is entirely your own."],
    [0,  20,  "You are just beginning, and already there is something remarkable about you."],
    [20, 35,  "You are in a remarkable chapter of life, and it shows in every feature."],
    [20, 35,  "There is a vitality about you right now that is genuinely striking."],
    [20, 35,  "You carry the confidence of someone who is coming into their own — beautifully."],
    [35, 55,  "You wear your years with a grace and confidence that only deepens with time."],
    [35, 55,  "There is a richness to your presence that only comes with lived experience."],
    [35, 55,  "You have grown into yourself in the most beautiful way."],
    [55, 120, "There is a warmth and wisdom in your face that only experience can give."],
    [55, 120, "The life you have lived has given your face a depth that is truly beautiful."],
    [55, 120, "You carry your years like a quiet crown — with dignity and unmistakable grace."],
  ];

  // Track last used index per category to avoid repeats
  const lastUsed = {};

  function pickNoRepeat(pool, key) {
    if (!lastUsed[key]) lastUsed[key] = [];
    let available = pool.map((_, i) => i).filter(i => !lastUsed[key].includes(i));
    if (available.length === 0) { lastUsed[key] = []; available = pool.map((_, i) => i); }
    const idx = available[Math.floor(Math.random() * available.length)];
    lastUsed[key].push(idx);
    if (lastUsed[key].length > Math.floor(pool.length / 2)) lastUsed[key].shift();
    return pool[idx];
  }

  function buildComment(detection) {
    const dominant = Object.entries(detection.expressions)
      .sort((a, b) => b[1] - a[1])[0][0];
    const age = Math.round(detection.age);

    const expressionPool = lines[dominant] || lines.neutral;
    const expressionLine = pickNoRepeat(expressionPool, dominant);

    const agePool = ageLines.filter(([min, max]) => age >= min && age < max);
    const ageLine = agePool.length ? pickNoRepeat(agePool.map(r => r[2]), `age_${dominant}`) : '';

    return ageLine ? `${expressionLine}\n\n${ageLine}` : expressionLine;
  }

  /* ── Typewriter ────────────────────────────────────── */
  function typewriter(el, text, speed = 22) {
    return new Promise(resolve => {
      el.innerHTML = '';
      const cursor = document.createElement('span');
      cursor.className = 'cursor';
      el.appendChild(cursor);
      const chars = [...text];
      let i = 0;
      function tick() {
        if (i < chars.length) {
          const ch = chars[i++];
          if (ch === '\n' && chars[i] === '\n') {
            cursor.insertAdjacentHTML('beforebegin', '<br><br>');
            i++;
          } else {
            cursor.insertAdjacentText('beforebegin', ch);
          }
          setTimeout(tick, speed + Math.random() * 16);
        } else {
          setTimeout(() => { cursor.remove(); resolve(); }, 900);
        }
      }
      tick();
    });
  }

  /* ── Load models ───────────────────────────────────── */
  async function loadModels() {
    loadingLabel.textContent = 'Loading AI models…';
    loadingOverlay.classList.add('active');
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
      ]);
      loadingOverlay.classList.remove('active');
      setState('idle');
    } catch (err) {
      loadingLabel.textContent = 'Failed to load models. Check your connection.';
      console.error(err);
    }
  }

  /* ── Capture & analyse ─────────────────────────────── */
  captureBtn.addEventListener('click', async () => {
    if (!video.srcObject) return;

    setState('loading');
    loadingLabel.textContent = 'The mirror sees you…';

    try {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions()
        .withAgeAndGender();

      setState('response');

      if (!detection) {
        await typewriter(responseText, "I cannot quite see you clearly… step a little closer and let the mirror find your face.");
      } else {
        await typewriter(responseText, buildComment(detection));
      }
    } catch (err) {
      setState('response');
      responseText.style.color = 'rgba(255,110,110,0.85)';
      responseText.textContent = `The mirror falters… ${err.message}`;
      setTimeout(() => { responseText.style.color = ''; setState('idle'); }, 4000);
      console.error(err);
    }
  });

  /* ── Tap mirror to reset ───────────────────────────── */
  mirrorFrame.addEventListener('click', () => {
    if (appState === 'response') setState('idle');
  });

  /* ── Init ──────────────────────────────────────────── */
  setState('init');
  initCamera();
  loadModels();
})();
