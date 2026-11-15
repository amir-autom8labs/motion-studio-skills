// PixiJS — 9,000 additive WebGL sprites morphing between words. Positions are a pure function
// of time (no accumulated state), so any frame can be rendered in isolation.
import { Application, ParticleContainer, Particle, Texture } from 'pixi.js';
import { rng, ease, clamp, lerp, unit } from 'motion-kit';
import { brand } from '../_shared/brand.js';

// workers: 2 — software WebGL is already multi-threaded, so more parallel browsers just fight for cores.
export const config = { width: 1920, height: 1080, fps: 30, duration: 7, background: brand.bg, crf: 24, workers: 2, seekable: true };
const WORDS = ['FAST', 'FLUID', 'LUMEN'];
const N = 9000;

function samplePoints(text, width, height, n, rand) {
  const c = document.createElement('canvas'); c.width = width; c.height = height;
  const g = c.getContext('2d');
  let size = height * 0.5;
  g.font = `800 ${size}px 'Inter Display', Inter, sans-serif`;
  size *= Math.min(1, (width * 0.8) / g.measureText(text).width);
  g.font = `800 ${size}px 'Inter Display', Inter, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, width / 2, height / 2);
  const d = g.getImageData(0, 0, width, height).data, pts = [];
  for (let y = 0; y < height; y += 3) for (let x = 0; x < width; x += 3) if (d[(y * width + x) * 4 + 3] > 128) pts.push([x, y]);
  return Array.from({ length: n }, () => pts[(rand() * pts.length) | 0]);
}

export default async function scene({ root, width, height, duration, transparent }) {
  const u = unit(width, height), rand = rng(7);
  await document.fonts.load(`800 100px 'Inter Display'`);
  const app = new Application();
  await app.init({ width, height, background: brand.bg, backgroundAlpha: transparent ? 0 : 1, antialias: false,
    autoStart: false, resolution: window.devicePixelRatio, autoDensity: true, preference: 'webgl', preserveDrawingBuffer: true });
  root.appendChild(app.canvas);

  // soft glow dot texture
  const dot = document.createElement('canvas'); dot.width = dot.height = 64;
  const dg = dot.getContext('2d'), grad = dg.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.25, 'rgba(255,255,255,.7)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
  dg.fillStyle = grad; dg.fillRect(0, 0, 64, 64);
  const tex = Texture.from(dot);

  const targets = WORDS.map((w) => samplePoints(w, width, height, N, rand));
  const tints = [0x7c5cff, 0x22d3ee, 0xff5c8a, 0xffffff];
  // ParticleContainer = one draw call for everything. Plain Sprites are ~10x slower under software WebGL.
  const layer = new ParticleContainer({ dynamicProperties: { position: true, vertex: true, color: true } });
  layer.blendMode = 'add'; app.stage.addChild(layer);
  const parts = Array.from({ length: N }, (_, i) => {
    const s = new Particle({ texture: tex, anchorX: 0.5, anchorY: 0.5, tint: tints[(rand() * rand() * 4) | 0] });
    layer.addParticle(s);
    const ang = rand() * Math.PI * 2, rad = Math.max(width, height) * (0.55 + rand() * 0.5);
    return { s, start: [width / 2 + Math.cos(ang) * rad, height / 2 + Math.sin(ang) * rad], delay: rand() * 0.45,
      phase: rand() * Math.PI * 2, size: (0.06 + rand() * 0.11) * u(1) / 6, swirl: (rand() - 0.5) * u(26),
      out: [Math.cos(ang) * rad * 1.3, Math.sin(ang) * rad * 1.3] };
  });

  // keyframes: gather -> word0 -> word1 -> word2 -> burst
  const seg = (duration - 1.2) / WORDS.length;       // time per word
  const MOVE = 0.9;                                   // morph time
  return (t) => {
    for (let i = 0; i < N; i++) {
      const p = parts[i];
      const k = Math.min(WORDS.length - 1, Math.floor(t / seg));
      const local = t - k * seg;
      const from = k === 0 ? p.start : targets[k - 1][i];
      const to = targets[k][i];
      const m = ease.inOutCubic(clamp((local - p.delay) / MOVE));
      const arc = Math.sin(m * Math.PI) * p.swirl;    // curved path while morphing
      let x = lerp(from[0], to[0], m) + arc * Math.cos(p.phase);
      let y = lerp(from[1], to[1], m) + arc * Math.sin(p.phase);
      x += Math.sin(t * 2.2 + p.phase) * u(0.25); y += Math.cos(t * 1.7 + p.phase) * u(0.25); // idle shimmer
      const b = ease.inExpo(clamp((t - (duration - 1.0) - p.delay * 0.4) / 0.9)); // final burst
      x += p.out[0] * b; y += p.out[1] * b;
      p.s.x = x; p.s.y = y;
      p.s.scaleX = p.s.scaleY = p.size * (1 + 1.6 * Math.sin(m * Math.PI) + 2 * b);
      p.s.alpha = (k === 0 ? clamp(local / 0.4) : 1) * (0.4 + 0.3 * Math.sin(t * 5 + p.phase)) * (1 - b);
    }
    app.render();
  };
}
