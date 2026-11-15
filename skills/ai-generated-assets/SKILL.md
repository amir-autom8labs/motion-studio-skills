---
name: ai-generated-assets
description: Bring AI-generated assets into a motion clip — text/image-to-video footage (LTX-2), talking portraits (LivePortrait), image-to-3D product models (Hunyuan3D-2, TRELLIS), generated music (MusicGen) and frame interpolation for slow motion or 60 fps (RIFE). Use when a clip needs photoreal footage, a presenter, a 3D object or generated music that code-drawn animation cannot provide, and to check GPU requirements and licence limits before committing to one of these models.
---

# AI-generated assets

These models need an NVIDIA GPU and model downloads. **None of them were run while building this plugin** (the build machine had no GPU and no access to model hosting), so treat the commands in each project's README as the source of truth and budget time for setup. What *is* verified is how their outputs plug into the pipeline — the integration below uses the same paths the demos exercise.

Ask first: can code do it? Titles, UI, charts, particles and music are faster, sharper, deterministic and free of licence questions when drawn with the other skills. Use AI for what code can't make: footage, faces, real-looking objects.

## The models

| Need | Model | Min VRAM (README) | Licence limits to check before commercial use |
|---|---|---|---|
| B-roll / hero footage with audio | LTX-2 | not stated | Code Apache-2.0; **weights under LTX-2 Community License — companies with ≥ $10M annual revenue need a paid licence** |
| Still portrait → talking/moving head | LivePortrait | not stated | Code MIT, but **bundled InsightFace detection models are non-commercial research only** — replace them for commercial work. Use only faces you have rights and consent for |
| Image → textured 3D model | Hunyuan3D-2 | 6 GB shape, 16 GB with texture | Tencent community licence: **not licensed in the EU, UK or South Korea**; > 1M MAU needs a licence |
| Image → 3D asset | TRELLIS | 16 GB (Linux + NVIDIA) | MIT (some submodules differ) — the safer 3D choice |
| Text → music | MusicGen (audiocraft) | 16 GB for medium | Code MIT, **weights CC-BY-NC 4.0: non-commercial only** — not for a product launch; use `tonejs-soundtrack` or licensed music |
| Smooth slow-mo / 30→60 fps | RIFE (Practical-RIFE) | not stated | MIT |

Licence facts were read from each repo's LICENSE/README; model-card pages could not be checked. Re-read the licence for the exact model version you download.

## Plugging outputs into the pipeline

- **Video (LTX-2, LivePortrait)** → use as a plate. Render titles/callouts with `motion render scene.js --transparent -o overlay.mov`, then
  `ffmpeg -i plate.mp4 -i overlay.mov -filter_complex "[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30[b];[b][1:v]overlay=shortest=1" -c:v libx264 -crf 18 -pix_fmt yuv420p out.mp4`.
  Or cut it between coded shots with `motion concat` (it conforms size and frame rate to the first clip).
- **Music (MusicGen or any file)** → `motion render scene.js --audio track.wav`. The scene receives `audio.level` / `audio.bass` per frame, so visuals can react to it.
- **3D (Hunyuan3D-2, TRELLIS)** → export `.glb`, put it in the scene folder, load with three.js (`npm i --prefix ${CLAUDE_PLUGIN_ROOT}/toolkit three`) inside a scene: create the renderer with `preserveDrawingBuffer: true`, set camera/rotation from `t` in the per-frame function, call `renderer.render()` there. Software WebGL is slow; use `workers: 2`.
- **RIFE** → only for footage. Coded scenes don't need it: render at `--fps 60` directly, and for slow motion render the scene with a longer duration. For AI or camera footage without a GPU, ffmpeg's motion interpolation is a usable fallback: `ffmpeg -i in.mp4 -vf "minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:vsbmf=1" out.mp4` (slow, artefacts on fast motion).

## Prompting generated footage so it cuts with coded shots

- Match the grade: name the brand's background and accent colours in the prompt; dark plates take overlays best.
- Ask for slow, single-direction camera moves and leave negative space where titles go.
- Generate at the delivery aspect ratio; generate 1–2 s more than needed and trim.
- Never put text in generated video — add it as a coded overlay.

OpenToonz (hand-drawn 2D animation suite) is deliberately not covered: it is a GUI tool for frame-by-frame artists, not something an agent can drive.
