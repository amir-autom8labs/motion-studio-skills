---
name: matter-physics
description: Add real 2D rigid-body physics with matter-js — objects that drop, bounce, stack, collide, swing or scatter; feature pills raining into a pile, logos tumbling, a floor that opens, balls knocking text over. Use when motion should look physically caused rather than choreographed, for playful product moments and "everything included" shots.
---

# matter-js physics shots

Template: `${CLAUDE_PLUGIN_ROOT}/demos/05-matter-physics/scene.js` — 24 labelled pills drop and pile up, then the floor is removed.

Use Matter only as the simulator; draw the bodies yourself on a canvas (or position DOM nodes) so the look matches the brand.

```js
import Matter from 'matter-js';
import { makeCanvas, rng } from 'motion-kit';
const { Engine, Bodies, Body, Composite } = Matter;

export default function scene({ root, width, height, fps }) {
  const { ctx } = makeCanvas(root, width, height);
  const engine = Engine.create({ gravity: { y: 1.6 } });
  Composite.add(engine.world, [/* static floor + walls, 100px thick, just outside the frame */]);
  const SUB = 4, dt = 1000 / fps / SUB;
  return (t) => {
    // add bodies when their cue time passes; remove the floor at the exit cue
    if (t > 0) for (let i = 0; i < SUB; i++) Engine.update(engine, dt);
    // draw: ctx.translate(body.position.x, body.position.y); ctx.rotate(body.angle); …
  };
}
```

## What matters

- **Fixed timestep, never `Matter.Runner`.** Step `Engine.update(engine, 1000/fps/SUB)` with 2–4 substeps inside the per-frame function. Same input → identical pile every render.
- **Not seekable** (simulation state); the simulation itself is cheap, so renders are still quick.
- **Seeded spawn** with `rng(seed)` for x-position, angle and spin. Change the seed to re-roll a pile you don't like; that is the main art-direction lever.
- **Spawn on a schedule** (one every 120–180 ms) from just above the frame, not all at once — a stream reads better and avoids an explosion of overlapping bodies.
- **Tuning**: `restitution` 0.3–0.5 (bounce), `friction` 0.4, `density` 0.002, gravity y 1.4–2 for weighty-but-quick. Thick static walls (100 px) stop tunnelling. `chamfer: { radius }` for pills.
- **Keep labels upright**: bodies settle at any angle, so flip text 180° when `Math.cos(body.angle) < 0`.
- **Size bodies large** — pill height ≥ 10% of the short side — and count them so the settled pile fills roughly the bottom third to half of the frame.
- **Plan the ending**: remove the floor, flip gravity, or apply an outward impulse (`Body.applyForce`) ~1.5 s before the end so the frame clears for the next shot.
- **DOM title above the canvas** with `z-index` so bodies pass behind it; or make the title a static body so pills bounce off it.
