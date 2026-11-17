// motion-kit: tiny helpers shared by scenes. Import with: import { ease, prog } from 'motion-kit'
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const map = (v, a, b, c, d) => c + (d - c) * clamp((v - a) / (b - a));

export const ease = {
  linear: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inCubic: (t) => t * t * t,
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  inOutExpo: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
  outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  outElastic: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
};

// Eased 0..1 progress of a window [start, start+dur] at time t (seconds).
export const prog = (t, start, dur, fn = ease.outCubic) => fn(clamp((t - start) / dur));

// Deterministic PRNG independent of Math.random.
export const rng = (seed = 1) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// A canvas sized to the scene in CSS pixels, backed at device resolution.
export const makeCanvas = (root, width, height) => {
  const dpr = window.devicePixelRatio || 1;
  const c = document.createElement('canvas');
  c.width = Math.round(width * dpr);
  c.height = Math.round(height * dpr);
  c.style.cssText = `position:absolute;inset:0;width:${width}px;height:${height}px`;
  root.appendChild(c);
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  return { canvas: c, ctx };
};

// Shorthand element builder: el('div', {class:'x', style:'...'}, parent, 'text')
export const el = (tag, attrs = {}, parent, text) => {
  const svg = ['svg', 'path', 'g', 'circle', 'rect', 'line', 'text', 'defs', 'linearGradient', 'stop', 'polyline'].includes(tag);
  const e = svg ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text != null) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
};

export const css = (root, text) => el('style', {}, root, text);

// Unit that scales with the frame: u(1) = 1% of the shorter side. Keeps layouts aspect-agnostic.
export const unit = (width, height) => (n) => (Math.min(width, height) / 100) * n;

// Closed-form spring: position at time t (seconds) after release, settling 0 -> 1. No state between
// frames, so any frame renders alone and lands identically every time.
//   damping 1.0 = no overshoot (text, UI)   0.8 = one small bounce (products, cards)   0.5 = two bounces (characters)
//   omega = speed in rad/s (12 slow, 18 normal, 26 snappy)
export const spring = (t, { damping = 0.8, omega = 18 } = {}) => {
  if (t <= 0) return 0;
  const z = damping, w = omega;
  if (z < 1) { const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t)); }
  if (z === 1) return 1 - Math.exp(-w * t) * (1 + w * t);
  const s = Math.sqrt(z * z - 1), r1 = -w * (z - s), r2 = -w * (z + s);
  return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
};

// Register bundled font files and wait until they are usable (DOM and canvas).
//   import file from '@fontsource/archivo-black/files/archivo-black-latin-400-normal.woff2';
//   await loadFonts([{ family: 'Archivo Black', src: file, weight: 400 }]);
export const loadFonts = async (fonts) => {
  await Promise.all(fonts.map(async ({ family, src, weight = 400, style = 'normal' }) => {
    const f = new FontFace(family, `url(${src})`, { weight: String(weight), style });
    document.fonts.add(await f.load());
  }));
};

// Colour helpers. rgba('#ff5a1f', 0.4) -> 'rgba(255,90,31,0.4)'; ink(bg) -> readable text colour on that fill.
const rgb = (hex) => { const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? [...h].map((c) => c + c).join('') : h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
export const rgba = (hex, a = 1) => `rgba(${rgb(hex).join(',')},${a})`;
export const hexInt = (hex) => { const [r, g, b] = rgb(hex); return (r << 16) | (g << 8) | b; };
export const ink = (hex, dark = '#0b0b0b', light = '#ffffff') => { const [r, g, b] = rgb(hex); return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? dark : light; };
