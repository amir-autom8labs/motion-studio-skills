// matter-js — feature pills drop, collide and pile up; then the floor opens. Fixed-step simulation
// (never Matter.Runner) so the result is identical on every render.
import Matter from 'matter-js';
import { makeCanvas, rng, unit, el, css, prog, ease } from 'motion-kit';
import { brand, palette } from '../_shared/brand.js';

export const config = { width: 1920, height: 1080, fps: 30, duration: 7, background: brand.bg };
const LABELS = ['Timelines', 'Springs', 'Particles', 'Physics', 'Charts', 'Audio', '4K', '60 fps', 'Alpha', 'Vertical', 'GIF',
  'Shaders', 'SVG', 'Type', 'Loops', 'Beats', 'Morphs', 'Easing', 'WebGL', 'Canvas', 'React', 'Data', 'Stagger', 'Blur'];

export default function scene({ root, width, height, fps, duration }) {
  const u = unit(width, height), rand = rng(3);
  const { ctx } = makeCanvas(root, width, height);
  css(root, `.t{position:absolute;left:0;right:0;top:${u(9)}px;z-index:2;text-align:center;font:800 ${u(9.5)}px ${brand.font};letter-spacing:-.04em;color:${brand.text}}
    .t small{display:block;font:500 ${u(3.6)}px ${brand.font};letter-spacing:0;color:${brand.dim};margin-top:${u(1.5)}px}`);
  const title = el('div', { class: 't' }, root); title.innerHTML = 'Everything, in one pipeline<small>24 capabilities. Zero plugins to babysit.</small>';

  const { Engine, Bodies, Body, Composite } = Matter;
  const engine = Engine.create({ gravity: { y: 1.6 } });
  const wall = (x, y, w, h) => Bodies.rectangle(x, y, w, h, { isStatic: true });
  const floor = wall(width / 2, height + 50, width * 2, 100);
  Composite.add(engine.world, [floor, wall(-50, height / 2, 100, height * 4), wall(width + 50, height / 2, 100, height * 4)]);

  ctx.font = `650 ${u(4.6)}px ${brand.font}`;
  const pills = LABELS.map((label, i) => {
    const w = ctx.measureText(label).width + u(8), h = u(11);
    const body = Bodies.rectangle(width * (0.12 + rand() * 0.76), -h - rand() * u(10), w, h,
      { chamfer: { radius: h / 2 - 1 }, restitution: 0.35, friction: 0.4, density: 0.002, angle: (rand() - 0.5) * 1.2 });
    Body.setAngularVelocity(body, (rand() - 0.5) * 0.15);
    return { label, w, h, body, at: 0.25 + i * 0.14, color: palette[i % palette.length], added: false, filled: i % 3 !== 1 };
  });

  const SUB = 4, dt = 1000 / fps / SUB;
  let floorGone = false;
  return (t) => {
    for (const p of pills) if (!p.added && t >= p.at) { Composite.add(engine.world, p.body); p.added = true; }
    if (!floorGone && t >= duration - 1.5) { Composite.remove(engine.world, floor); floorGone = true; }
    if (t > 0) for (let i = 0; i < SUB; i++) Engine.update(engine, dt);

    title.style.opacity = prog(t, 0.1, 0.8) * (1 - prog(t, duration - 1.2, 0.6, ease.inCubic));
    title.style.transform = `translateY(${(1 - prog(t, 0.1, 0.9, ease.outExpo)) * u(3)}px)`;
    ctx.clearRect(0, 0, width, height);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `650 ${u(4.6)}px ${brand.font}`;
    for (const p of pills) {
      if (!p.added) continue;
      const { x, y } = p.body.position;
      ctx.save(); ctx.translate(x, y); ctx.rotate(p.body.angle);
      ctx.beginPath(); ctx.roundRect(-p.w / 2, -p.h / 2, p.w, p.h, p.h / 2);
      if (p.filled) { ctx.fillStyle = p.color; ctx.fill(); ctx.fillStyle = brand.bg; }
      else { ctx.fillStyle = brand.panel; ctx.fill(); ctx.lineWidth = u(0.35); ctx.strokeStyle = p.color; ctx.stroke(); ctx.fillStyle = brand.text; }
      if (Math.cos(p.body.angle) < 0) ctx.rotate(Math.PI); // keep labels the right way up
      ctx.fillText(p.label, 0, u(0.3));
      ctx.restore();
    }
  };
}
