// p5.js — generative flow-field plate. Trails accumulate on the canvas (stateful), so we drive
// p5 with noLoop() + redraw() once per captured frame.
import p5 from 'p5';
import { brand, palette } from '../_shared/brand.js';

export const config = { width: 1920, height: 1080, fps: 30, duration: 8, background: brand.bg, crf: 26, seed: 11 };

export default function scene({ root, width, height, params }) {
  const COUNT = params.count ?? 3600;
  p5.disableFriendlyErrors = true; // FES would otherwise fetch translation files at runtime
  return new Promise((resolve) => {
    new p5((p) => {
      let pts = [];
      const GROUPS = palette.flatMap((color) => [{ color, w: 1.2 }, { color, w: 2.6 }]);
      const spawn = () => ({ x: p.random(width), y: p.random(height), g: Math.floor(p.random(GROUPS.length)), life: p.random(40, 220) });
      p.setup = () => {
        p.createCanvas(width, height);
        p.randomSeed(11); p.noiseSeed(11);
        p.background(brand.bg);
        pts = Array.from({ length: COUNT }, spawn);
        p.noLoop();
        resolve(() => p.redraw());
      };
      p.draw = () => {
        const t = p.frameCount / 30, g = p.drawingContext;
        p.blendMode(p.BLEND);
        p.noStroke(); p.fill(7, 8, 13, 14); p.rect(0, 0, width, height); // slow fade = long trails
        p.blendMode(p.ADD);
        const scale = 0.0016, cx = width / 2, cy = height / 2;
        // Hot loop: p5 for noise/random, raw canvas paths for drawing. One stroke() per colour group
        // instead of one per segment is ~20x faster than p.stroke()+p.line() per particle.
        const paths = GROUPS.map(() => new Path2D());
        for (let s = 0; s < 3; s++) {
          for (const q of pts) {
            const n = p.noise(q.x * scale, q.y * scale, t * 0.12);
            // noise field + a slow vortex around the centre so the composition has a focal point
            const a = n * Math.PI * 4 + Math.atan2(q.y - cy, q.x - cx) + Math.PI / 2;
            const nx = q.x + Math.cos(a) * 2.4, ny = q.y + Math.sin(a) * 2.4;
            paths[q.g].moveTo(q.x, q.y); paths[q.g].lineTo(nx, ny);
            q.x = nx; q.y = ny;
            if (--q.life < 0 || nx < 0 || ny < 0 || nx > width || ny > height) Object.assign(q, spawn());
          }
        }
        g.globalAlpha = 0.42; g.lineCap = 'round';
        GROUPS.forEach((grp, i) => { g.strokeStyle = grp.color; g.lineWidth = grp.w; g.stroke(paths[i]); });
        g.globalAlpha = 1;
      };
    }, root);
  });
}
