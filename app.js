const progressBar = document.getElementById('progress-bar');
const reveals = [...document.querySelectorAll('.reveal')];
const parallaxEls = [...document.querySelectorAll('.parallax')];
const tiltEls = [...document.querySelectorAll('.tilt')];
const sectionEls = [...document.querySelectorAll('section[id]')];
const navLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
const routedSections = [...document.querySelectorAll('main > section.story, main > section.panel-block')];
const movingTitles = [...document.querySelectorAll('main > section.story h2, main > section.panel-block h2')];
const routeActive = document.getElementById('route-active');

function updateProgress() {
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  const ratio = max > 0 ? doc.scrollTop / max : 0;
  progressBar.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
}

const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.2 });

reveals.forEach((el, i) => {
  el.style.transitionDelay = `${Math.min(i * 35, 280)}ms`;
  io.observe(el);
});

routedSections.forEach((sec, i) => {
  sec.classList.add(i % 2 === 0 ? 'route-left' : 'route-right');
});

movingTitles.forEach((el) => el.classList.add('moving-title'));

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
    }
  });
}, { threshold: 0.15 });

sectionEls.forEach((s) => sectionObserver.observe(s));

function updateParallax() {
  const y = window.scrollY;
  parallaxEls.forEach((el) => {
    const speed = Number(el.dataset.speed || 0.08);
    el.style.transform = `translate3d(0, ${-y * speed * 0.12}px, 0)`;
  });
}

const scene = document.querySelector('[data-scene]');
const slides = scene ? [...scene.querySelectorAll('.slide')] : [];
const dotsHost = scene ? scene.querySelector('[data-dots]') : null;
let dots = [];

if (dotsHost && slides.length) {
  slides.forEach((_, i) => {
    const d = document.createElement('span');
    d.className = `dot ${i === 0 ? 'on' : ''}`;
    dotsHost.appendChild(d);
  });
  dots = [...dotsHost.querySelectorAll('.dot')];
}

function updateSceneSteps() {
  if (!scene || !slides.length) return;
  const rect = scene.getBoundingClientRect();
  const total = rect.height - window.innerHeight;
  if (total <= 0) return;
  const passed = Math.min(Math.max(-rect.top, 0), total);
  const ratio = passed / total;
  const step = Math.min(slides.length - 1, Math.floor(ratio * slides.length));

  slides.forEach((s, i) => s.classList.toggle('is-active', i === step));
  dots.forEach((d, i) => d.classList.toggle('on', i === step));
}

function updateActiveNav() {
  const offset = 160;
  let activeId = '';
  sectionEls.forEach((sec) => {
    if (window.scrollY >= sec.offsetTop - offset) {
      activeId = sec.id;
    }
  });
  navLinks.forEach((link) => {
    const id = link.getAttribute('href').slice(1);
    link.classList.toggle('active', id === activeId);
  });
}

function setActiveNavById(id) {
  navLinks.forEach((link) => {
    const linkId = link.getAttribute('href').slice(1);
    link.classList.toggle('active', linkId === id);
  });
}

function updateRouteMap() {
  if (!routeActive) return;
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  const ratio = max > 0 ? doc.scrollTop / max : 0;
  const len = routeActive.getTotalLength();
  routeActive.style.strokeDasharray = `${len}`;
  routeActive.style.strokeDashoffset = `${len * (1 - ratio)}`;
}

function updateTitleDrift() {
  const winH = window.innerHeight;
  movingTitles.forEach((title) => {
    const section = title.closest('section');
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const dist = (center - winH / 2) / winH;
    const dir = section.classList.contains('route-right') ? 1 : -1;
    const shift = Math.max(-1, Math.min(1, dist)) * 22 * dir;
    title.style.transform = `translateX(${shift}px)`;
  });
}

function updateBackgroundDrift() {
  const y = window.scrollY || 0;
  document.body.style.setProperty('--bg-drift', `${y}px`);
}

window.addEventListener('scroll', () => {
  updateProgress();
  updateParallax();
  updateSceneSteps();
  updateActiveNav();
  updateRouteMap();
  updateTitleDrift();
  updateBackgroundDrift();
}, { passive: true });

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    const id = link.getAttribute('href').slice(1);
    setActiveNavById(id);
    requestAnimationFrame(updateActiveNav);
    setTimeout(updateActiveNav, 420);
  });
});

window.addEventListener('hashchange', () => {
  const id = window.location.hash.replace('#', '');
  if (id) setActiveNavById(id);
  requestAnimationFrame(updateActiveNav);
});

updateProgress();
updateParallax();
updateSceneSteps();
updateActiveNav();
updateRouteMap();
updateTitleDrift();
updateBackgroundDrift();

if (window.location.hash) {
  const id = window.location.hash.replace('#', '');
  if (id) setActiveNavById(id);
}

const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let w = 0;
let h = 0;
let dpr = Math.min(window.devicePixelRatio || 1, 2);

const points = Array.from({ length: 90 }, () => ({
  x: Math.random(),
  y: Math.random(),
  vx: (Math.random() - 0.5) * 0.0007,
  vy: (Math.random() - 0.5) * 0.0007,
  r: 0.8 + Math.random() * 1.8,
}));

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function draw(t) {
  const time = t * 0.001;
  ctx.clearRect(0, 0, w, h);

  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#06070a');
  bg.addColorStop(0.5, '#0a0e15');
  bg.addColorStop(1, '#090b10');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const gx1 = w * (0.8 + Math.sin(time * 0.2) * 0.06);
  const gy1 = h * (0.18 + Math.cos(time * 0.16) * 0.06);
  const glow1 = ctx.createRadialGradient(gx1, gy1, 20, gx1, gy1, 420);
  glow1.addColorStop(0, 'rgba(255,90,54,.20)');
  glow1.addColorStop(1, 'rgba(255,90,54,0)');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, w, h);

  const gx2 = w * (0.22 + Math.cos(time * 0.18) * 0.05);
  const gy2 = h * (0.84 + Math.sin(time * 0.2) * 0.05);
  const glow2 = ctx.createRadialGradient(gx2, gy2, 20, gx2, gy2, 380);
  glow2.addColorStop(0, 'rgba(108,152,255,.16)');
  glow2.addColorStop(1, 'rgba(108,152,255,0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, w, h);

  for (const p of points) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > 1) p.vx *= -1;
    if (p.y < 0 || p.y > 1) p.vy *= -1;
    const x = p.x * w;
    const y = p.y * h;
    ctx.beginPath();
    ctx.arc(x, y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,.33)';
    ctx.fill();
  }

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const a = points[i], b = points[j];
      const ax = a.x * w, ay = a.y * h;
      const bx = b.x * w, by = b.y * h;
      const d = Math.hypot(ax - bx, ay - by);
      if (d < 130) {
        ctx.strokeStyle = `rgba(255,138,107,${(1 - d / 130) * 0.15})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(draw);
}

resize();
requestAnimationFrame(draw);
window.addEventListener('resize', resize);
window.addEventListener('resize', () => {
  updateRouteMap();
  updateTitleDrift();
  updateBackgroundDrift();
});

tiltEls.forEach((el) => {
  el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const rx = (0.5 - y) * 7;
    const ry = (x - 0.5) * 8;
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'rotateX(0deg) rotateY(0deg)';
  });
});

const lobsterLogo = 'https://mintcdn.com/clawdhub/A8OxQpxR3DcyCCHY/assets/pixel-lobster.svg?fit=max&auto=format&n=A8OxQpxR3DcyCCHY&q=85&s=7d28d01258a677dc2c3e3ad383948e91';
const heroTitle = document.querySelector('#hero h1');
const thanksLogo = document.querySelector('#thanks .thanks-logo');
const gameLayer = document.getElementById('lobster-game');
const gameCanvas = document.getElementById('lobster-game-canvas');
const gameCtx = gameCanvas ? gameCanvas.getContext('2d') : null;

function showEggToast(text) {
  const toast = document.createElement('div');
  toast.className = 'egg-toast';
  toast.textContent = text;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('on'));
  setTimeout(() => {
    toast.classList.remove('on');
    setTimeout(() => toast.remove(), 260);
  }, 1800);
}

function triggerLobsterRain() {
  const wrap = document.createElement('div');
  wrap.className = 'lobster-rain';
  for (let i = 0; i < 18; i += 1) {
    const d = document.createElement('span');
    d.className = 'lobster-drop';
    d.style.left = `${Math.random() * 100}%`;
    d.style.animationDelay = `${Math.random() * 1.6}s`;
    d.style.animationDuration = `${2.6 + Math.random() * 1.8}s`;
    d.style.backgroundImage = `url("${lobsterLogo}")`;
    wrap.appendChild(d);
  }
  document.body.appendChild(wrap);
  showEggToast('彩蛋已触发：龙虾像素雨');
  setTimeout(() => wrap.remove(), 5200);
}

function triggerTerminalMode() {
  document.body.classList.add('egg-terminal');
  showEggToast('终端绿屏模式：ON');
  setTimeout(() => {
    document.body.classList.remove('egg-terminal');
  }, 4200);
}

const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiBuffer = [];
let typeBuffer = '';
let heroTap = 0;
let heroTapTimer = null;
let thanksTap = 0;
let thanksTapTimer = null;
let rocketBuffer = '';
let gameActive = false;
let gameRaf = 0;
let gameOver = false;
let gameOverUntil = 0;
let highScore = Number(localStorage.getItem('lobster_high_score') || 0);
let gameOverTag = '';
let loseStreak = 0;

const gameState = {
  w: 0,
  h: 0,
  dpr: 1,
  t: 0,
  speed: 1.35,
  score: 0,
  lobsterX: 0,
  lobsterY: 0,
  lobsterTargetX: 0,
  lobsterW: 54,
  lobsterH: 54,
  laneCenters: [],
  playerLane: 2,
  lastGapLane: 2,
  obstacleCount: 0,
  spawnTimer: 80,
  gapCenter: 0,
  obstacles: [],
  particles: [],
  debris: [],
  hurtUntil: 0,
  rocketUntil: 0,
};

const bitterQuotes = [
  '有人负重前行，你在负重右移。',
  '别人身残志坚，你是手慢志不坚。',
  '你以为在打游戏，其实在练反应力。',
  '生活不给存档，至少这里有重开。',
  '真正的强者，不抱怨砖块刷新快。',
];

const gameplayTips = [
  'TIP: 盯住下一块通道，不要盯龙虾本体。',
  'TIP: 长位移出现前，先把自己放到中轨。',
  'TIP: 连续小步比一次猛打方向更稳。',
  'TIP: mkg 大招留给连续压砖时再开。',
  'TIP: 看速度 SPD，越高越要提前换轨。',
];

const lobsterSprite = new Image();
lobsterSprite.src = lobsterLogo;

if (heroTitle) {
  heroTitle.addEventListener('click', () => {
    heroTap += 1;
    clearTimeout(heroTapTimer);
    heroTapTimer = setTimeout(() => { heroTap = 0; }, 900);
    if (heroTap >= 3) {
      heroTap = 0;
      triggerTerminalMode();
    }
  });
}

function resizeGameCanvas() {
  if (!gameCanvas || !gameCtx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const wv = window.innerWidth;
  const hv = window.innerHeight;
  gameCanvas.width = Math.floor(wv * dpr);
  gameCanvas.height = Math.floor(hv * dpr);
  gameCanvas.style.width = `${wv}px`;
  gameCanvas.style.height = `${hv}px`;
  gameCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  gameState.w = wv;
  gameState.h = hv;
}

function resetGame(runToast = false) {
  gameState.t = 0;
  gameState.speed = 1.35;
  gameState.score = 0;
  gameState.laneCenters = Array.from({ length: 5 }, (_, i) => gameState.w * (0.22 + i * 0.14));
  gameState.playerLane = 2;
  gameState.lastGapLane = 2;
  gameState.obstacleCount = 0;
  gameState.spawnTimer = 82;
  gameState.lobsterX = gameState.w * 0.5;
  gameState.lobsterY = gameState.h * 0.68;
  gameState.lobsterTargetX = gameState.laneCenters[gameState.playerLane];
  gameState.gapCenter = gameState.w * 0.5;
  gameState.obstacles = [];
  gameState.debris = [];
  gameState.particles = Array.from({ length: 65 }, () => ({
    x: Math.random() * gameState.w,
    y: Math.random() * gameState.h,
    s: 1 + Math.random() * 2.5,
  }));
  gameState.hurtUntil = 0;
  gameState.rocketUntil = 0;
  gameOver = false;
  gameOverUntil = 0;
  gameOverTag = '';
  rocketBuffer = '';
  if (runToast) showEggToast('龙虾闯关已重启');
}

function spawnObstacle() {
  const lanes = gameState.laneCenters.length;
  const longJump = gameState.obstacleCount > 0 && gameState.obstacleCount % 5 === 0;
  let nextLane = gameState.lastGapLane;
  if (longJump) {
    const farChoices = [];
    for (let i = 0; i < lanes; i += 1) {
      if (Math.abs(i - gameState.lastGapLane) >= 2) farChoices.push(i);
    }
    nextLane = farChoices[Math.floor(Math.random() * farChoices.length)];
  } else {
    const nearChoices = [];
    for (let i = 0; i < lanes; i += 1) {
      if (i !== gameState.lastGapLane) nearChoices.push(i);
    }
    nextLane = nearChoices[Math.floor(Math.random() * nearChoices.length)];
  }
  gameState.lastGapLane = nextLane;
  gameState.obstacleCount += 1;

  const laneStep = gameState.laneCenters[1] - gameState.laneCenters[0];
  const gapW = laneStep * 1.28 * 1.8;
  const gapCenter = gameState.laneCenters[nextLane];
  const gapX = Math.max(0, gapCenter - gapW * 0.5);
  gameState.obstacles.push({
    y: -20,
    h: 16 + Math.random() * 12,
    gapX,
    gapW,
  });
  return longJump;
}

function burstObstacle(o) {
  const blockSize = 8;
  const leftCols = Math.max(2, Math.floor(o.gapX / blockSize));
  const rightW = gameState.w - (o.gapX + o.gapW);
  const rightCols = Math.max(2, Math.floor(rightW / blockSize));
  const rows = Math.max(2, Math.floor(o.h / blockSize));

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < leftCols; c += 1) {
      if (Math.random() < 0.7) {
        gameState.debris.push({
          x: c * blockSize,
          y: o.y + r * blockSize,
          vx: -1.6 - Math.random() * 2.6,
          vy: -1.2 + Math.random() * 2.2,
          life: 36 + Math.random() * 26,
          s: blockSize - 1,
        });
      }
    }
    for (let c = 0; c < rightCols; c += 1) {
      if (Math.random() < 0.7) {
        gameState.debris.push({
          x: o.gapX + o.gapW + c * blockSize,
          y: o.y + r * blockSize,
          vx: 1.6 + Math.random() * 2.6,
          vy: -1.2 + Math.random() * 2.2,
          life: 36 + Math.random() * 26,
          s: blockSize - 1,
        });
      }
    }
  }
}

function drawPixelBarrier(o) {
  const px = 9;
  const rows = Math.max(1, Math.floor(o.h / px));
  const leftCols = Math.max(1, Math.floor(o.gapX / px));
  const rightStart = o.gapX + o.gapW;
  const rightCols = Math.max(1, Math.floor((gameState.w - rightStart) / px));
  for (let r = 0; r < rows; r += 1) {
    const yy = o.y + r * px;
    for (let c = 0; c < leftCols; c += 1) {
      const xx = c * px;
      const lit = (c + r) % 2 === 0;
      gameCtx.fillStyle = lit ? 'rgba(255,98,98,.92)' : 'rgba(205,58,58,.88)';
      gameCtx.fillRect(xx, yy, px - 1, px - 1);
    }
    for (let c = 0; c < rightCols; c += 1) {
      const xx = rightStart + c * px;
      const lit = (c + r) % 2 === 0;
      gameCtx.fillStyle = lit ? 'rgba(255,98,98,.92)' : 'rgba(205,58,58,.88)';
      gameCtx.fillRect(xx, yy, px - 1, px - 1);
    }
  }
}

function drawGame(now) {
  if (!gameActive || !gameCtx) return;
  gameState.t += 1;
  const { w: wv, h: hv } = gameState;

  gameCtx.clearRect(0, 0, wv, hv);

  const bg = gameCtx.createLinearGradient(0, 0, 0, hv);
  bg.addColorStop(0, '#05080c');
  bg.addColorStop(1, '#010203');
  gameCtx.fillStyle = bg;
  gameCtx.fillRect(0, 0, wv, hv);

  gameCtx.strokeStyle = 'rgba(125,255,139,.1)';
  for (let y = (gameState.t * gameState.speed) % 24; y < hv; y += 24) {
    gameCtx.beginPath();
    gameCtx.moveTo(0, y);
    gameCtx.lineTo(wv, y);
    gameCtx.stroke();
  }

  gameCtx.strokeStyle = 'rgba(125,255,139,.06)';
  for (let x = 0; x < wv; x += 28) {
    gameCtx.beginPath();
    gameCtx.moveTo(x, 0);
    gameCtx.lineTo(x, hv);
    gameCtx.stroke();
  }

  for (const p of gameState.particles) {
    p.y += gameState.speed * 0.85 + p.s * 0.35;
    if (p.y > hv + 4) {
      p.y = -6;
      p.x = Math.random() * wv;
    }
    gameCtx.fillStyle = 'rgba(125,255,139,.55)';
    gameCtx.fillRect(p.x, p.y, p.s, p.s);
  }

  if (!gameOver) {
    gameState.spawnTimer -= gameState.speed * 0.95;
    if (gameState.spawnTimer <= 0) {
      const longJump = spawnObstacle();
      const base = Math.max(64, 104 - Math.floor(gameState.score * 0.9));
      gameState.spawnTimer = longJump ? base + 26 : base;
    }
    gameState.speed = Math.min(4.6, gameState.speed + 0.00065);
  }
  const rocketOn = now < gameState.rocketUntil;

  const lobsterHalf = gameState.lobsterW * 0.5;
  gameState.lobsterTargetX = gameState.laneCenters[gameState.playerLane];
  {
    const dx = gameState.lobsterTargetX - gameState.lobsterX;
    const maxStep = 20 + gameState.speed * 2.6;
    gameState.lobsterX += Math.sign(dx) * Math.min(Math.abs(dx), maxStep);
  }
  gameState.lobsterX = Math.max(lobsterHalf + 8, Math.min(wv - lobsterHalf - 8, gameState.lobsterX));

  let collision = false;
  let crossed = 0;
  gameState.obstacles = gameState.obstacles.filter((o) => {
    o.y += gameState.speed;
    if (o.y > hv + 30) {
      crossed += 1;
      return false;
    }
    if (rocketOn) {
      burstObstacle(o);
      crossed += 1;
      return false;
    }
    const inY = gameState.lobsterY > o.y - gameState.lobsterH * 0.25 && gameState.lobsterY < o.y + o.h + gameState.lobsterH * 0.28;
    const inGap = gameState.lobsterX > o.gapX && gameState.lobsterX < o.gapX + o.gapW;
    if (inY && !inGap) collision = true;
    return true;
  });
  if (crossed > 0) gameState.score += crossed;

  for (const o of gameState.obstacles) drawPixelBarrier(o);
  gameState.debris = gameState.debris.filter((d) => {
    d.x += d.vx;
    d.y += d.vy;
    d.vy += 0.08;
    d.life -= 1;
    if (d.life <= 0 || d.y > hv + 20) return false;
    const alpha = Math.max(0, Math.min(1, d.life / 52));
    gameCtx.fillStyle = `rgba(255,110,90,${alpha})`;
    gameCtx.fillRect(d.x, d.y, d.s, d.s);
    return true;
  });

  const bob = Math.sin(gameState.t * 0.16) * 5;
  const lx = gameState.lobsterX - gameState.lobsterW / 2;
  const ly = gameState.lobsterY - gameState.lobsterH / 2 + bob;

  if (rocketOn) {
    const flameGrad = gameCtx.createLinearGradient(gameState.lobsterX, gameState.lobsterY - 22, gameState.lobsterX, hv);
    flameGrad.addColorStop(0, 'rgba(255, 190, 80, .9)');
    flameGrad.addColorStop(0.55, 'rgba(255, 90, 50, .55)');
    flameGrad.addColorStop(1, 'rgba(255, 60, 40, 0)');
    gameCtx.fillStyle = flameGrad;
    gameCtx.beginPath();
    gameCtx.moveTo(gameState.lobsterX - 16, gameState.lobsterY - 10);
    gameCtx.lineTo(gameState.lobsterX + 16, gameState.lobsterY - 10);
    gameCtx.lineTo(gameState.lobsterX + 38, hv);
    gameCtx.lineTo(gameState.lobsterX - 38, hv);
    gameCtx.closePath();
    gameCtx.fill();
    gameCtx.shadowColor = 'rgba(255, 140, 80, .6)';
    gameCtx.shadowBlur = 16;
  }

  if (lobsterSprite.complete) {
    gameCtx.drawImage(lobsterSprite, lx, ly, gameState.lobsterW, gameState.lobsterH);
  } else {
    gameCtx.fillStyle = '#ff6f4f';
    gameCtx.fillRect(lx, ly, gameState.lobsterW, gameState.lobsterH);
  }
  gameCtx.shadowBlur = 0;

  if (!rocketOn && !gameOver && collision && now > gameState.hurtUntil) {
    gameState.hurtUntil = now + 900;
    gameOver = true;
    gameOverUntil = now + 2100;
    loseStreak += 1;
    if (loseStreak >= 5) {
      gameOverTag = '我爱NANA';
      loseStreak = 0;
    } else {
      gameOverTag = bitterQuotes[Math.floor(Math.random() * bitterQuotes.length)];
    }
    if (gameState.score > highScore) {
      highScore = gameState.score;
      localStorage.setItem('lobster_high_score', String(highScore));
      showEggToast(`新纪录 ${highScore} 分`);
    } else {
      showEggToast(`游戏结束：${gameState.score} 分，历史最佳 ${highScore} 分`);
    }
  }

  const scoreY = 38;
  const fontPixel = "'Press Start 2P','SF Mono',Menlo,Monaco,Consolas,monospace";
  gameCtx.fillStyle = '#8cff9f';
  gameCtx.shadowColor = 'rgba(125,255,139,.55)';
  gameCtx.shadowBlur = 14;
  gameCtx.font = `700 30px ${fontPixel}`;
  const scoreLabel = `SCORE ${gameState.score}`;
  const bestLabel = `BEST ${highScore}`;
  gameCtx.fillText(scoreLabel, 28, scoreY);
  const bestW = gameCtx.measureText(bestLabel).width;
  gameCtx.fillText(bestLabel, wv - bestW - 28, scoreY);
  gameCtx.shadowBlur = 0;
  gameCtx.font = `600 12px ${fontPixel}`;
  gameCtx.fillStyle = '#d7ffe0';
  gameCtx.fillText(`SPD ${gameState.speed.toFixed(2)}`, wv * 0.5 - 38, scoreY);

  if (rocketOn) {
    gameCtx.fillStyle = 'rgba(255, 190, 90, .95)';
    gameCtx.fillRect(wv - 176, 18, 160, 26);
    gameCtx.fillStyle = '#201106';
    gameCtx.font = '700 12px SF Mono, Menlo, Monaco, Consolas, monospace';
    gameCtx.fillText('MKG BOOST ON', wv - 166, 36);
  }

  const tip = gameplayTips[Math.floor((gameState.t / 220) % gameplayTips.length)];
  gameCtx.fillStyle = 'rgba(10, 20, 14, .72)';
  gameCtx.fillRect(wv * 0.5 - 330, 72, 660, 26);
  gameCtx.strokeStyle = 'rgba(125,255,139,.35)';
  gameCtx.strokeRect(wv * 0.5 - 330, 72, 660, 26);
  gameCtx.fillStyle = 'rgba(210, 236, 255, .9)';
  gameCtx.font = `600 14px ${fontPixel}`;
  const tipW = gameCtx.measureText(tip).width;
  gameCtx.fillText(tip, wv * 0.5 - tipW * 0.5, 91);

  if (gameOver) {
    gameCtx.fillStyle = 'rgba(2, 5, 8, .68)';
    gameCtx.fillRect(0, 0, wv, hv);
    gameCtx.strokeStyle = 'rgba(125,255,139,.14)';
    gameCtx.lineWidth = 1;
    for (let y = 0; y < hv; y += 4) {
      gameCtx.beginPath();
      gameCtx.moveTo(0, y);
      gameCtx.lineTo(wv, y);
      gameCtx.stroke();
    }
    gameCtx.fillStyle = '#f2f7ff';
    gameCtx.shadowColor = 'rgba(255,255,255,.28)';
    gameCtx.shadowBlur = 16;
    gameCtx.font = `700 86px ${fontPixel}`;
    const overText = 'GAME OVER';
    const overW = gameCtx.measureText(overText).width;
    gameCtx.fillText(overText, wv * 0.5 - overW * 0.5, hv * 0.38);
    gameCtx.fillStyle = '#9dffae';
    gameCtx.shadowColor = 'rgba(125,255,139,.45)';
    gameCtx.shadowBlur = 14;
    gameCtx.font = `700 36px ${fontPixel}`;
    const s1 = `本局 ${gameState.score} 分`;
    const s2 = `历史最佳 ${highScore} 分`;
    const s1W = gameCtx.measureText(s1).width;
    const s2W = gameCtx.measureText(s2).width;
    gameCtx.fillText(s1, wv * 0.5 - s1W * 0.5, hv * 0.50);
    gameCtx.fillText(s2, wv * 0.5 - s2W * 0.5, hv * 0.57);
    gameCtx.font = `600 20px ${fontPixel}`;
    gameCtx.fillStyle = '#ffd1c6';
    const easterW = gameCtx.measureText(gameOverTag).width;
    gameCtx.fillText(gameOverTag, wv * 0.5 - easterW * 0.5, hv * 0.66);
    gameCtx.fillStyle = '#c8d4e8';
    gameCtx.shadowBlur = 0;
    gameCtx.font = `600 20px ${fontPixel}`;
    const s3 = '2秒后自动重开 · ESC 退出';
    const s3W = gameCtx.measureText(s3).width;
    gameCtx.fillText(s3, wv * 0.5 - s3W * 0.5, hv * 0.74);
    if (now >= gameOverUntil) resetGame(false);
  }

  gameRaf = requestAnimationFrame(drawGame);
}

function startLobsterGame() {
  if (gameActive || !gameLayer || !gameCanvas || !gameCtx) return;
  gameActive = true;
  document.body.classList.add('lobster-game-on');
  resizeGameCanvas();
  resetGame();
  gameRaf = requestAnimationFrame(drawGame);
  showEggToast('龙虾闯关模式已启动');
}

function stopLobsterGame() {
  if (!gameActive) return;
  gameActive = false;
  document.body.classList.remove('lobster-game-on');
  cancelAnimationFrame(gameRaf);
  gameRaf = 0;
}

if (thanksLogo) {
  thanksLogo.addEventListener('click', () => {
    thanksTap += 1;
    clearTimeout(thanksTapTimer);
    thanksTapTimer = setTimeout(() => { thanksTap = 0; }, 1200);
    if (thanksTap >= 5) {
      thanksTap = 0;
      startLobsterGame();
    }
  });
}

if (gameLayer) {
  gameLayer.addEventListener('mousemove', (e) => {
    if (!gameActive) return;
    let best = 0;
    let bestDist = Infinity;
    gameState.laneCenters.forEach((x, i) => {
      const d = Math.abs(x - e.clientX);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    gameState.playerLane = best;
  });
  gameLayer.addEventListener('touchmove', (e) => {
    if (!gameActive || !e.touches[0]) return;
    const tx = e.touches[0].clientX;
    let best = 0;
    let bestDist = Infinity;
    gameState.laneCenters.forEach((x, i) => {
      const d = Math.abs(x - tx);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    gameState.playerLane = best;
  }, { passive: true });
}

window.addEventListener('resize', () => {
  if (gameActive) {
    resizeGameCanvas();
    const oldLane = gameState.playerLane;
    gameState.laneCenters = Array.from({ length: 5 }, (_, i) => gameState.w * (0.22 + i * 0.14));
    gameState.playerLane = Math.max(0, Math.min(gameState.laneCenters.length - 1, oldLane));
    gameState.lobsterTargetX = gameState.laneCenters[gameState.playerLane];
  }
});

window.addEventListener('keydown', (e) => {
  if (gameActive) {
    if (e.key === 'Escape') {
      stopLobsterGame();
      return;
    }
    const key = e.key.length === 1 ? e.key.toLowerCase() : '';
    if (key) {
      rocketBuffer = (rocketBuffer + key).slice(-8);
      if (rocketBuffer.includes('mkg')) {
        rocketBuffer = '';
        gameState.rocketUntil = performance.now() + 7000;
        showEggToast('火箭模式启动：砖块撞飞');
      }
    }
    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') gameState.playerLane -= 1;
    if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') gameState.playerLane += 1;
    gameState.playerLane = Math.max(0, Math.min(gameState.laneCenters.length - 1, gameState.playerLane));
    return;
  }

  const target = e.target;
  const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
  if (isInput) return;

  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

  konamiBuffer.push(key);
  if (konamiBuffer.length > konami.length) konamiBuffer.shift();
  if (konami.every((k, i) => konamiBuffer[i] === k)) {
    konamiBuffer = [];
    triggerLobsterRain();
  }

  const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 280;
  if (!nearBottom || e.key.length !== 1) return;
  typeBuffer = (typeBuffer + key).slice(-10);
  if (typeBuffer.includes(':agent')) {
    typeBuffer = '';
    showEggToast('AI 已进入执行态');
  }
});
