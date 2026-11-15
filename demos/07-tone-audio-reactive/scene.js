// Tone.js — the soundtrack is composed in code and rendered offline; the renderer hands the
// per-frame loudness back to the scene (ctx.audio.level / .bass) so the visuals react to it.
import { makeCanvas, unit, ease, clamp } from 'motion-kit';
import { brand } from '../_shared/brand.js';
import { score, BAR, BEAT } from '../_shared/music.js';

// seekable: every frame is a pure function of (t, audio), so workers can skip straight to their frames.
export const config = { width: 1920, height: 1080, fps: 30, duration: 8, background: brand.bg, seekable: true };
export const audio = (ctx) => score(ctx);

const WORDS = ['Compose.', 'Sync.', 'Render.', 'Ship.'];

export default function scene({ root, width, height, fps, audio }) {
  const u = unit(width, height);
  const { ctx } = makeCanvas(root, width, height);
  const cx = width / 2, cy = height / 2, BARS = 96;
  const at = (arr, f) => (arr && f >= 0 ? arr[Math.min(arr.length - 1, f)] ?? 0 : 0);

  return (t, frame) => {
    const level = at(audio?.level, frame), bass = at(audio?.bass, frame);
    const smooth = (bass + at(audio?.bass, frame - 1) * 0.6 + at(audio?.bass, frame - 2) * 0.3) / 1.9;
    ctx.clearRect(0, 0, width, height);

    // glow that breathes with the bass
    const R = u(25) * (1 + smooth * 0.2);
    const g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 2.6);
    g.addColorStop(0, `rgba(124,92,255,${0.25 + smooth * 0.4})`); g.addColorStop(1, 'rgba(124,92,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, width, height);

    // radial bars: each bar shows the level from a few frames ago, so energy ripples around the ring
    ctx.lineCap = 'round'; ctx.lineWidth = u(0.75);
    for (let i = 0; i < BARS; i++) {
      const k = Math.min(i, BARS - i);                       // mirror left/right
      const v = at(audio?.level, frame - Math.round(k * 0.45));
      const wob = 0.6 + 0.4 * Math.sin(i * 1.7 + t * 3);
      const len = u(1) + v * wob * u(20);
      const a = (i / BARS) * Math.PI * 2 - Math.PI / 2;
      ctx.strokeStyle = `hsl(${250 - (k / (BARS / 2)) * 65} 90% ${58 + v * 20}%)`;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (R + u(1.5)), cy + Math.sin(a) * (R + u(1.5)));
      ctx.lineTo(cx + Math.cos(a) * (R + u(1.5) + len), cy + Math.sin(a) * (R + u(1.5) + len));
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = u(0.2);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

    // one word per bar, punched in on the downbeat
    const bar = Math.min(WORDS.length - 1, Math.floor(t / BAR)), local = t - bar * BAR;
    const pin = ease.outBack(clamp(local / 0.35)), pout = clamp((local - (BAR - 0.18)) / 0.18);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(0.7 + 0.3 * pin + smooth * 0.03, 0.7 + 0.3 * pin + smooth * 0.03);
    ctx.globalAlpha = clamp(local / 0.15) * (bar === WORDS.length - 1 ? 1 : 1 - pout);
    ctx.fillStyle = brand.text; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `800 ${u(9)}px ${brand.font}`; ctx.fillText(WORDS[bar], 0, 0);
    ctx.restore();

    // beat ticks along the bottom
    const beats = Math.round((config.duration / BEAT));
    for (let b = 0; b < beats; b++) {
      const on = t >= b * BEAT, hit = clamp(1 - (t - b * BEAT) / 0.25);
      ctx.fillStyle = on ? (b % 4 === 0 ? brand.b : brand.text) : 'rgba(255,255,255,.15)';
      const w = u(1.1) * (1 + (on ? hit : 0) * 0.9);
      ctx.beginPath(); ctx.arc(cx + (b - (beats - 1) / 2) * u(3.4), height - u(8), w / 2, 0, Math.PI * 2); ctx.fill();
    }
  };
}
