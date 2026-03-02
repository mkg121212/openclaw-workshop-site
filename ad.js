const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let w = 0;
let h = 0;
let dpr = Math.min(window.devicePixelRatio || 1, 2);

const points = Array.from({ length: 76 }, () => ({
  x: Math.random(),
  y: Math.random(),
  vx: (Math.random() - 0.5) * 0.0008,
  vy: (Math.random() - 0.5) * 0.0008,
  r: 0.9 + Math.random() * 1.8,
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
  bg.addColorStop(0, '#05070c');
  bg.addColorStop(0.5, '#0a0f17');
  bg.addColorStop(1, '#06080d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const gx = w * (0.72 + Math.sin(time * 0.2) * 0.08);
  const gy = h * (0.16 + Math.cos(time * 0.18) * 0.07);
  const g = ctx.createRadialGradient(gx, gy, 20, gx, gy, 380);
  g.addColorStop(0, 'rgba(255,90,90,.2)');
  g.addColorStop(1, 'rgba(255,90,90,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  for (const p of points) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > 1) p.vx *= -1;
    if (p.y < 0 || p.y > 1) p.vy *= -1;
    const x = p.x * w;
    const y = p.y * h;
    ctx.fillStyle = 'rgba(125,255,139,.42)';
    ctx.fillRect(x, y, p.r, p.r);
  }

  requestAnimationFrame(draw);
}

resize();
requestAnimationFrame(draw);
window.addEventListener('resize', resize);
