---
name: p5-generative
description: Generate organic, algorithmic background plates and textures with p5.js — flow fields, noise landscapes, particle trails, generative patterns, brand-coloured ambient loops. Use when a clip needs a living background behind titles, an abstract visual for a social post, or a unique generative look instead of stock footage.
---

# p5.js generative plates

Template: `${CLAUDE_PLUGIN_ROOT}/demos/04-p5-generative/scene.js` (noise flow field with a central vortex). `demos/08-alpha-lower-third` shows a title overlaid on it.

```js
import p5 from 'p5';
export const config = { width: 1920, height: 1080, fps: 30, duration: 8, background: '#07080d', seed: 11, crf: 26 };

export default function scene({ root, width, height }) {
  p5.disableFriendlyErrors = true;
  return new Promise((resolve) => {
    new p5((p) => {
      p.setup = () => {
        p.createCanvas(width, height);
        p.randomSeed(11); p.noiseSeed(11);      // p5 has its own generators — seed them
        p.background('#07080d');
        p.noLoop();                              // the renderer drives frames…
        resolve(() => p.redraw());               // …one redraw per captured frame
      };
      p.draw = () => { /* use p.frameCount / fps as time */ };
    }, root);
  });
}
```

## What matters

- **Instance mode + `noLoop()` + `redraw()`** as above. Resolve the scene promise from inside `setup` so frames start only when p5 is ready.
- **Seed p5's own RNG** (`randomSeed`, `noiseSeed`) — the toolkit seeds `Math.random` but p5 keeps separate state.
- **Trails are stateful**: not `seekable`. A contact sheet replays from frame 0, so iterate at `--preset hd`.
- **Hot loops: p5 for maths, raw canvas for drawing.** `p.stroke()`+`p.line()` per segment is slow in p5 2.x. Collect segments into a few `Path2D`s grouped by colour/weight and `p.drawingContext.stroke(path)` once per group.
- **Long trails**: instead of clearing, paint a translucent background rect each frame (alpha 10–20 of 255), then draw with `p.blendMode(p.ADD)`.
- **Give it composition.** Pure noise is wallpaper. Add a focal structure — a vortex term (`atan2` to centre + 90°), an attractor, a masked region kept empty for the title — and limit to 3–5 brand colours.
- **Brightness**: additive strokes at alpha < 0.25 look nearly black once video-compressed. Aim for visible structure at thumbnail size; check the sheet.
- **Bitrate**: fine line detail is the worst case for H.264 — 8 s is ~60 MB at crf 16, ~17 MB at crf 26. Set `crf: 26` in config; as a background under titles go to 28 or darken it.
- **As a plate**: render once, then overlay transparent title renders with ffmpeg (see `render-pipeline`) so retiming titles doesn't re-simulate the field.
- p5 logs a harmless 404 for a translation file at startup; ignore it.
