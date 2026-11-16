# Demos

Each folder is one scene exercising one engine. Outputs are in `out/`, contact sheets in `out/sheets/`.

| Demo | Engine | Shows | Output |
|---|---|---|---|
| 01-anime-launch-title | anime.js | Kinetic title, SVG logo draw-on, CTA, exit | `out/01-anime-launch-title.mp4` |
| 02-react-spring-ui | react-spring | Scripted UI walkthrough on springs | `.mp4`, `.portrait.mp4`, `.gif` |
| 03-pixi-particles | PixiJS | 9,000 particles morphing between words | `out/03-pixi-particles.mp4` |
| 04-p5-generative | p5.js | Flow-field background plate | not committed (17 MB) — shown in 08 |
| 05-matter-physics | matter-js | Feature pills drop, pile, fall away | `out/05-matter-physics.mp4` |
| 06-d3-data-story | D3 | Line draws on, number counts, annotation | `.mp4`, `.portrait.mp4` |
| 07-tone-audio-reactive | Tone.js | Code-composed track driving the visuals | `out/07-tone-audio-reactive.mp4` (has audio) |
| 08-alpha-lower-third | anime.js | Transparent overlay composited on the p5 plate | `out/08-overlay-on-plate.mp4` |
| 09-launch-reel | concat + Tone.js | Five clips, crossfades, one soundtrack | `out/09-launch-reel.mp4` (32 s, has audio) |
| 10-three-product-spin | three.js | Device mockup with UI on screen, camera dolly, DOM title | `out/10-three-product-spin.mp4` |
| 11-blender-hero | Blender (bpy, Cycles) | Ray-traced hero still + draft turntable | `out/11-blender-hero.png`, `out/11-blender-turntable-draft.mp4` |

Regenerate everything:

```bash
cd toolkit && npm ci
```

```bash
for s in 01-anime-launch-title/scene.js 02-react-spring-ui/scene.jsx 03-pixi-particles/scene.js 04-p5-generative/scene.js 05-matter-physics/scene.js 06-d3-data-story/scene.js 07-tone-audio-reactive/scene.js; do node toolkit/motion.mjs render demos/$s -o demos/out/$(dirname $s).mp4; done
```

```bash
node toolkit/motion.mjs render demos/08-alpha-lower-third/scene.js --transparent -o demos/out/08-alpha-lower-third.mov
```

```bash
bash demos/09-launch-reel/build.sh
```

Blender demo (needs `pip install bpy` in a venv):

```bash
python demos/11-blender-hero/render.py --quality final --frames 18 --out demos/11-blender-hero/out/hero_
```
