---
name: pixi-particles
description: Create particle effects and WebGL visuals with PixiJS v8 — thousands of glowing particles forming and morphing between words or logos, bursts, confetti, starfields, energy trails, glow FX. Use for hero moments, logo stings, transitions and any shot needing more moving elements than DOM or canvas 2D can handle.
---

# PixiJS particles and FX

Template: `${CLAUDE_PLUGIN_ROOT}/demos/03-pixi-particles/scene.js` — 9,000 additive particles morphing FAST → FLUID → LUMEN, then bursting.

```js
import { Application, ParticleContainer, Particle, Texture } from 'pixi.js';

export const config = { width: 1920, height: 1080, fps: 30, duration: 7, background: '#07080d',
  workers: 2, seekable: true, crf: 24 };

export default async function scene({ root, width, height, transparent }) {
  const app = new Application();
  await app.init({ width, height, background: '#07080d', backgroundAlpha: transparent ? 0 : 1,
    autoStart: false,                       // we call app.render() ourselves
    resolution: window.devicePixelRatio, autoDensity: true, preference: 'webgl', preserveDrawingBuffer: true });
  root.appendChild(app.canvas);
  const layer = new ParticleContainer({ dynamicProperties: { position: true, vertex: true, color: true } });
  layer.blendMode = 'add';
  app.stage.addChild(layer);
  // … addParticle(new Particle({ texture, anchorX: .5, anchorY: .5, tint }))
  return (t) => { /* set p.x, p.y, p.scaleX, p.scaleY, p.alpha from t */ app.render(); };
}
```

## What matters

- **`ParticleContainer` + `Particle`, not `Sprite`.** With no GPU (most render boxes) WebGL runs in software: 9,000 Sprites took ~0.35 s/frame, the same scene as Particles ~0.1 s. Turn on only the `dynamicProperties` you change.
- **`autoStart: false` and render in the per-frame function.** Don't use `app.ticker` deltas for motion.
- **Make positions a pure function of time** where you can: `pos = lerp(from, to, ease(clamp((t - start - delay) / dur)))`. Then `seekable: true` works, contact sheets are instant and any frame can be re-rendered alone. Use accumulated velocity only for true simulations.
- **`workers: 2`**: software GL is already multi-threaded; four browsers fight each other.
- **Fill rate is the budget.** Cost ≈ particles × on-screen area × overdraw. Keep the glow texture small (64 px), particle scale small, and avoid full-screen additive quads.
- **Text/logo targets**: draw the word (or an SVG/PNG logo) to an offscreen 2D canvas, collect opaque pixels on a 3 px grid, pick N at random (`rng(seed)`). `await document.fonts.load("800 100px 'Font'")` first.
- **Look**: additive blend + a soft radial-gradient dot + 3–4 tints weighted toward one hue. Additive stacks to white fast — keep per-particle alpha 0.3–0.6 so dense areas glow instead of clipping. Add a small sinusoidal shimmer so held shapes stay alive.
- **Morphs**: per-particle random delay (0–0.45 s) plus a sideways arc `sin(m·π) · swirl` so paths curve instead of sliding straight. Scale particles up mid-flight.
- **Encoding**: particle footage is high-entropy; set `crf: 24`–`26` in config or files get large.
- **Transparent**: `backgroundAlpha: 0` and render `--transparent` to composite sparks over other shots. Additive particles over transparency look dimmer once composited — raise alpha.
