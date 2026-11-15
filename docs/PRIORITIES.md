# Which packages earn a place, and why

Fourteen candidates were assessed for one job: letting an agent produce launch videos, social clips and capability demos **without a human operating an editor**. The test for each was (1) can an agent drive it headlessly, (2) does it produce something the others can't, (3) what does it cost to run, (4) can the output be used commercially.

Tier 1 packages were all exercised end to end on a 4-core machine with no GPU — every claim below about them comes from a render in `demos/out/`. Tier 2 could not be run here (no GPU, model hosting unreachable); their rows are from the projects' own READMEs and licence files.

## Tier 1 — core, verified, runs anywhere

| # | Package | Role in a clip | Share of typical launch-clip shots | Demo |
|---|---|---|---|---|
| 1 | **anime.js** (MIT) | Titles, kinetic type, logo/SVG reveals, lower thirds, CTAs | ~70% — the default | 01, 08 |
| 2 | **Tone.js** (MIT) | Soundtrack, impacts, beat grid, audio-reactive visuals | every clip with sound | 07, 09 |
| 3 | **D3** (ISC) | Animated charts that prove a claim | whenever there's a number | 06 |
| 4 | **PixiJS** (MIT) | Particle hero moments, morphing point clouds | 1 hero shot per clip | 03 |
| 5 | **react-spring** (MIT) | Product UI walkthroughs with physical feel | product demos | 02 |
| 6 | **matter-js** (MIT) | Things that fall, stack, collide | occasional accent | 05 |
| 7 | **p5.js** (LGPL-2.1) | Generative background plates | background layer | 04 |

Ranking logic: anime.js and Tone.js are first because they are needed in nearly every clip. D3 is third because data shots have no substitute. PixiJS, react-spring and matter-js each do one thing the others can't. p5.js is last in the tier: beautiful, but slowest to render, largest files, and only ever a background.

## Tier 2 — AI generation, GPU required, not verified here

| # | Package | Value | Blocker |
|---|---|---|---|
| 8 | **RIFE** (MIT) | Smooth slow-mo / 60 fps on footage | Only useful on AI or camera footage — coded scenes render natively at any frame rate |
| 9 | **LTX-2** | Photoreal footage with audio | GPU; weights need a paid licence for companies ≥ $10M revenue |
| 10 | **TRELLIS** (MIT) | Image → 3D product model | 16 GB NVIDIA GPU; then still needs a three.js scene to animate |
| 11 | **LivePortrait** | Talking presenter from a still | Bundled InsightFace models are non-commercial; consent/likeness concerns |
| 12 | **Hunyuan3D-2** | Image → textured 3D | 16 GB GPU; licence excludes EU, UK, South Korea |
| 13 | **MusicGen** | Text → music | Weights are CC-BY-NC — **cannot be used in commercial launch material**. Tone.js covers the need |

## Tier 3 — not included

| # | Package | Why |
|---|---|---|
| 14 | **OpenToonz** (BSD-3) | A GUI suite for hand-drawn frame-by-frame animation. It has a batch renderer for existing scene files, but an agent can't author the drawings |

## What the demos taught us (and the skills encode)

1. **A deterministic renderer is the real product.** All seven JS libraries run unmodified under a virtual clock; that one piece turns "browser animation" into "frame-perfect video".
2. **The most common defect is elements visible before their cue** — timeline libraries only apply start values when a tween begins.
3. **Web-sized layouts are far too small for video.** Every demo needed a 1.3–1.5× scale-up after the first contact sheet.
4. **Review stills, not code.** A contact sheet caught every layout problem (upside-down labels, portrait collisions, dim plates) in seconds.
5. **No GPU is fine, with care**: 2D canvas must not go through software GL (8× slower); WebGL particles need `ParticleContainer`; big CSS blurs are the slowest DOM operation.
6. **Compression is content-dependent**: UI and type are tiny (0.3–1 MB for 7 s); particle and flow-field footage is 5–60 MB and needs a higher CRF.
7. **Offline by default**: p5 tried to fetch a file from a CDN at startup and stalled the render; the renderer now refuses remote requests.
8. **Code-composed audio is enough for a bed plus impacts**, and feeding its loudness back to the visuals gives sync for free. Nobody has listened to it yet — see the README.
