---
name: render-pipeline
description: Render a JavaScript animation to a video file with the motion toolkit — scene file contract, the `motion` CLI (render, sheet, concat), MP4/WebM/GIF/ProRes-alpha output, aspect-ratio variants, parallel workers, and the determinism and performance rules. Use whenever writing or debugging a scene file, turning any browser animation into video frames, producing a contact sheet for review, stitching clips, or when a render is slow, blank, flickering or out of sync.
---

# Render pipeline

`motion` bundles a scene with esbuild, opens it in headless Chromium under a **virtual clock**, steps it one frame at a time, screenshots each frame and encodes with ffmpeg. Because time is virtual, a frame that takes 2 s to draw still lands at exactly 1/30 s — renders are frame-perfect and reproducible.

```bash
MOTION="node ${CLAUDE_PLUGIN_ROOT}/toolkit/motion.mjs"
$MOTION doctor                       # first run: checks deps, browser, ffmpeg and prints the fix
$MOTION sheet  scene.js -o sheet.png --count 8        # contact sheet — look at it before rendering
$MOTION render scene.js -o out.mp4                     # final
$MOTION check  out.mp4                                 # measure it: freezes, motion per second, loudness
```

If `doctor` reports missing packages run `npm ci --prefix ${CLAUDE_PLUGIN_ROOT}/toolkit`. Scene files can live anywhere (put them in the user's project); bare imports of `animejs`, `pixi.js`, `p5`, `matter-js`, `d3`, `tone`, `three`, `react`, `@react-spring/web` and `motion-kit` resolve to the toolkit's copies.

## Scene contract

```js
import { unit, el, css } from 'motion-kit';

export const config = { width: 1920, height: 1080, fps: 30, duration: 6, background: '#07080d' };

export default async function scene({ root, width, height, fps, duration, params, audio, transparent }) {
  const u = unit(width, height);          // u(1) = 1% of the short side
  // build DOM / canvas inside `root`, start animations
  return (t, frame) => { /* optional: called once per frame, t in seconds */ };
}

export const audio = (ctx) => /* optional: return an AudioBuffer, see tonejs-soundtrack */;
```

- `root` is a `width×height` positioned div. Put everything in it.
- Two ways to animate, mix freely: **(a)** start any library that uses `requestAnimationFrame` / `setTimeout` / `performance.now` / CSS animations — the virtual clock drives them; **(b)** return a per-frame function and compute state from `t`.
- `config` optional keys: `seed` (Math.random seed), `workers`, `seekable`, `params` (defaults for `--set`).
- `--set key=value` arrives as `params.key`: use it for copy, colours and variants instead of duplicating scenes.
- `motion-kit` exports `unit, el, css, makeCanvas, ease, prog, spring, clamp, lerp, map, rng, loadFonts, rgba, ink, hexInt`. `spring(t - start, { damping: 0.8, omega: 18 })` is a closed-form spring (0→1): the same landing whichever frame is drawn first. `prog(t, start, dur, ease.outCubic)` gives an eased 0→1 for a time window and is the simplest way to choreograph inside a per-frame function.

## CLI

```
render <scene> -o out.{mp4|webm|mov|gif|wav} | outdir/
  --preset landscape|portrait|square|4x5|hd    --size WxH    --fps N    --duration S
  --scale 2            supersample: 1080p layout → 4K pixels
  --from S --to S      render part of the timeline
  --transparent        alpha: .mov = ProRes 4444, .webm = VP9 alpha
  --audio file.wav     external soundtrack      --no-audio
  --crf 18             lower = bigger/better    --workers N
  --set k=v            scene params             --verbose   (page console)
sheet <scene> -o sheet.png [--at 0.5,2,4 | --count 8] [--cols 4]
concat a.mp4 b.mp4 … -o out.mp4 [--xfade 0.4] [--transition fade|wipeleft|slideup|…] [--audio track.wav]
check out.mp4 [--loop]        freezes ≥ 0.5 s, motion per second, loop seam, loudness of the encoded file
check scene.js                same frame from two runs must match; seekable scenes: cold frame = frame reached in sequence
global: --gpu  use the machine's GPU instead of software rendering (untested here; much faster WebGL where a GPU exists)
        --no-loudnorm  keep the soundtrack's own level (default normalises to −14 LUFS, true peak −2 dBTP)
```

Aspect variants: render the same scene once per preset. Scenes sized with `u()` and flex layout adapt; branch on `height > width` only where the composition must change (stack instead of side by side).

Overlay on footage: render with `--transparent -o overlay.mov`, then
`ffmpeg -i plate.mp4 -i overlay.mov -filter_complex "[0][1]overlay=shortest=1" -c:v libx264 -crf 18 -pix_fmt yuv420p out.mp4`.

## Review with measurements, not only stills

A contact sheet shows layout; it cannot show that a clip is frozen, that a move never happened, or that a loop stutters. After every render run `motion check out.mp4` and read it:

```
motion/s  ▇▂▇████▆   (peak 2.55 …)      each planned move should show as a bump; a flat stretch is a hold or a bug
freezes   10.17-11.40 s                 confirm each one is an intended hold
loop seam 0.41 vs typical step 0.38     with --loop: the jump from last frame to first must look like any other step
loudness  -14.2 LUFS, true peak -2.1    measured on the encoded file
```

Loops: the renderer draws frames 0 to N−1 and never frame N, so a scene whose state at `duration` equals its state at 0 loops without a doubled frame. Match position *and* velocity at the seam.

Before relying on `seekable: true`, run `motion check scene.js`: it renders the same frames cold and in sequence and reports any difference.

## Rules that prevent broken renders

1. **Hide things up front.** Timeline libraries apply "from" values only when a tween starts. Anything that enters later must start hidden (`opacity:0` in CSS or `utils.set`), or it flashes on screen before its cue. This is the most common defect — check the first sheet frame.
2. **No real time.** Never read the wall clock for logic, never `await` a real delay after setup. During setup `setTimeout` ≤ 50 ms is real (so loaders work); anything longer is virtual choreography.
3. **Finish loading inside `scene()`.** `await` fonts, images and engine init before returning. Frames start the moment it resolves.
4. **Offline by default.** Remote URLs are blocked so a render never depends on a CDN. Import assets (`import logo from './logo.svg'` gives a data URL) or `fetch('./data.json')` from the scene's folder (any file next to the scene is served at `./`). `--allow-network` opts out.
5. **Fixed-step simulations.** Physics and particles advance by a constant dt per frame, never by measured elapsed time.
6. **Randomness is seeded.** `Math.random` is seeded per render; use `rng(seed)` from motion-kit when a value must not change if code elsewhere adds a random call.
7. **Fonts**: only use fonts that are installed or imported as files. Check with `fc-list | grep -i "<name>"`; otherwise bundle a `.woff2` and declare `@font-face` with the imported data URL.

## Speed

Measured on 4 CPU cores, no GPU, 1080p30:

| Scene type | Typical speed | Notes |
|---|---|---|
| DOM/SVG, React | 5–15 frames/s | CSS `filter: blur()` is the main cost (the title demo's per-character blur holds it to ~5 fps); fake soft background blobs with `radial-gradient` instead |
| Canvas 2D | 4–20 frames/s | batch paths: one `stroke()` per colour, not per segment |
| WebGL (software) | 5–10 frames/s | fill-rate bound; set `workers: 2` in config, more just contends |

- `workers` defaults to 4 parallel browsers; each replays the whole timeline and captures every Nth frame.
- If every frame is a pure function of `t` (no accumulated state), set `seekable: true` in `config`: workers jump straight to their frames and `sheet` becomes near-instant. Do **not** set it for physics, trails, react-spring or anything that integrates over time.
- Iterate with `sheet`, `--preset hd`, or `--from/--to`; render full quality once.
- Dense particle or generative footage compresses badly (an 8 s flow field is ~60 MB at crf 16, ~17 MB at 26). Use `--crf 24`–`28` for those, 18 for UI and type.

## Troubleshooting

| Symptom | Cause |
|---|---|
| Element visible in frame 0 that should enter later | rule 1 |
| Animation frozen / only first frame | scene awaits something that depends on a long timer, or a library captured a real clock; drive it from the per-frame function instead |
| `selection.transition is not a function` etc. | handled: bundler keeps side-effect imports. If you see similar with another lib, import the sub-package explicitly |
| Blank WebGL canvas | create the context with `preserveDrawingBuffer: true`, and render inside the per-frame function |
| Render hangs at start | a remote fetch — keep it offline (rule 4) |
| Colours washed/dark in the MP4 | don't re-encode with your own ffmpeg flags; the toolkit tags BT.709 limited range correctly |
