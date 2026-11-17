---
name: animejs-titles
description: Build title sequences, kinetic typography, logo reveals, SVG line-drawing, lower thirds, CTAs and any DOM/SVG shot choreographed on a timeline with anime.js v4. Use for launch titles, feature callouts, text-led social clips, end cards, and as the default engine when a shot has no special need for physics, particles or charts.
---

# anime.js titles and kinetic type

Template: `${CLAUDE_PLUGIN_ROOT}/demos/01-anime-launch-title/scene.js` (title + logo draw + CTA) and `demos/08-alpha-lower-third/scene.js` (transparent overlay). Render mechanics: `render-pipeline` skill.

anime.js **v4** — named imports, not the v3 `anime({...})` call:

```js
import { createTimeline, animate, stagger, splitText, svg, utils } from 'animejs';

const chars = splitText(titleEl, { chars: true }).chars;      // also { words: true }, { lines: true }
const [draw] = svg.createDrawable(pathEl);
utils.set([...chars, cta], { opacity: 0 });                    // hide everything that enters later
utils.set(draw, { draw: '0 0' });

createTimeline({ defaults: { ease: 'outExpo' } })
  .add(draw,  { draw: ['0 0', '0 1'], duration: 1100, ease: 'inOutQuart' }, 350)   // 3rd arg = absolute ms
  .add(chars, { y: [u(16), 0], opacity: [0, 1], rotateX: [-80, 0], duration: 1000, delay: stagger(55) }, 600)
  .add(cta,   { opacity: [0, 1], scale: [0.92, 1], duration: 800, ease: 'outBack(1.4)' }, 3000)
  .add([title, cta], { opacity: 0, y: -u(3), duration: 500, ease: 'inQuart', delay: stagger(40) }, 5050);
```

## What matters

- **Initial states.** A timeline child applies its `from` value only when it starts. Without the `utils.set(...)` lines above, every late element is visible from frame 0. Verify on the first contact-sheet frame.
- **Absolute positions.** Give every `.add()` an explicit millisecond position. Relative offsets (`'-=200'`) make retiming to a beat grid painful.
- **Eases.** Enter: `outExpo` (snappy), `outQuart` (calm), `outBack(1.4–2)` (playful pop). Exit: `inQuart` / `inExpo`. Draw-ons and wipes: `inOutQuart` / `inOutExpo`. Ambient drift: `inOutSine` on a separate `animate()` that spans the whole clip.
- **Stagger.** Characters 30–60 ms, words 60–90 ms, list items 80–120 ms. Total stagger spread should stay under ~600 ms or the line reads slowly.
- **Per-character 3D** (`rotateX`) needs `display:inline-block` on the chars (splitText does this) and looks best with a slight blur-in: `filter: ['blur(12px)', 'blur(0px)']`.
- **Emphasis**: colour one headline word with the look's flat accent (`brand.fill`). Gradient-filled text reads as AI-generated; if a brand truly requires it, use `background-clip: text` with `padding-bottom: .1em` and animate the whole word, not split characters.
- **SVG draw-on** needs a stroked path (`fill:none`). For a filled logo: draw the outline, then fade/scale the fill in after.
- **Reveal wipes**: animate `clipPath` between two `inset()` values with identical structure (see the lower-third demo).
- **Cost**: CSS `filter: blur()` is the slowest thing in a DOM scene. Use it briefly on text entrances; for soft background blobs use `radial-gradient(closest-side, colour, transparent)` instead.

## Recipes

| Shot | Pattern |
|---|---|
| Title card | eyebrow pill → logo draw → name chars stagger → rule `scaleX` 0→1 → tagline words → CTA pop → exit |
| Feature callout | number/keyword scales in with `outBack`, supporting line fades up 250 ms later |
| Word swap ("Design. Build. Ship.") | each word: in 300 ms, hold one bar, out 180 ms; cut on beats |
| Lower third | accent bar `scaleY` → box `clipPath` wipe → text stagger; render `--transparent` |
| End card | logo + URL, hold ≥ 1.5 s, no exit animation (the last frame becomes the thumbnail) |
