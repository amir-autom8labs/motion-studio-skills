---
name: blender-render
description: Render photoreal 3D hero shots with headless Blender (the bpy Python module, Cycles ray tracing) — product beauty stills, short turntables, glossy reflections, soft area lighting, depth of field, transparent-background renders for compositing. Use when a shot must look physically real rather than real-time, for key art and thumbnails, or when the user has a .blend/.glb/.obj model to render; includes how to budget render time with and without a GPU.
---

# Blender hero renders

Template: `${CLAUDE_PLUGIN_ROOT}/demos/11-blender-hero/render.py` — a device modelled from primitives, three area lights, glossy floor, depth of field, a camera move parameterised by frame number, and draft/review/final quality presets.

Blender runs with no window and no install beyond pip:

```bash
python3 -m venv .blender && .blender/bin/pip install bpy
```

```bash
.blender/bin/python render.py --quality draft --frames 1-36 --out out/turntable_
```

(About 1.1 GB; the wheel needs a matching Python — if pip finds no version, use a standalone Blender and `blender -b -P render.py -- <args>`.)

## Budget first — ray tracing is slow on CPU

Measured on 4 CPU cores, the template scene:

| Preset | Size, samples | Per frame | Use |
|---|---|---|---|
| draft | 640 px, 16 | ~3 s | check framing and motion |
| review | 960 px, 32 | ~8 s | check light and materials |
| final | 1920 px, 96 | ~80 s | delivery |

So on CPU: finished **stills** are cheap, a 3 s final shot (90 frames) is around two hours, and anything longer is impractical. Plan accordingly:

- No GPU → use Blender for stills and for 1–3 s moves; do the rest in `threejs-3d`. A still can carry a whole shot: animate it in a scene (slow zoom, parallax, titles over it).
- GPU available → set `sc.cycles.device = 'GPU'` after enabling the device in preferences; expect roughly an order of magnitude faster, which makes whole shots practical. EEVEE (Blender's real-time engine) also needs a GPU — it produced no image on a GPU-less machine.
- Halve cost by rendering at 24 fps, or render every 2nd frame and interpolate.

## Workflow

1. Draft a **single frame** at the middle of the move, look at it, fix framing/exposure. Repeat at review quality for materials.
2. Draft the whole sequence, encode it, check the motion.
3. Render final frames as a PNG sequence — never straight to video. The template skips files that exist, so a crashed or interrupted render resumes, and frame ranges can be split across machines.
4. Encode: `ffmpeg -framerate 30 -i out/frame_%04d.png -vf "scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p" -c:v libx264 -crf 18 -movflags +faststart shot.mp4`, then `motion concat` with the other shots.
5. Titles: render them separately with `motion render … --transparent` and overlay; or render Blender with `--transparent` and place the object over a coded background.

## What matters

- **Start from `read_factory_settings(use_empty=True)`** and build everything in the script, so a render never depends on someone's startup file.
- **Pose from the frame number** (`pose(frame)` in the template) rather than keyframes: any frame renders alone, in any order.
- **Light with area lights**, not points: one large soft key (size 5–6, 2000–3000 W at ~8 units), two coloured rims behind the subject, a near-black world. Large lights make the soft highlights that read as "premium".
- **Glossy dark floor** (roughness ~0.18) gives the reflection under the product; same colour family as the background.
- **Exposure**: emissive screens blow out fast — emission strength ~1. Dark bodies vanish on dark backgrounds: lift base colour to ~0.1 and let the key light define the edges.
- **Lens 50–85 mm** and distance, not a wide lens up close. Depth of field: f/2.8 focused on the subject.
- **Denoising on** (`sc.cycles.use_denoising = True`) is what makes 16–96 samples usable. In animations very low sample counts flicker — don't go below ~64 for final motion.
- **Principled BSDF input names changed in Blender 4+** (`Emission Color`, `Emission Strength`, `Coat Weight`). If a name fails, print `[i.name for i in node.inputs]`.
- **Bevel everything**: a `BEVEL` modifier (width ~0.1, 8–10 segments) on hard edges catches highlights; unbevelled boxes look fake.
- **Importing models** (template: `demos/12-glb-model/render.py` + `prepare.py`): `bpy.ops.import_scene.gltf(filepath=…)`, `bpy.ops.wm.obj_import(…)`, or open a `.blend` with `bpy.ops.wm.open_mainfile`. Normalise first with `prepare.py`, parent all parts to one empty and rotate that. Imported models are often darker than expected: add a low, large fill light opposite the key.
- **Screen content**: load a screenshot with `bpy.data.images.load` into an Image Texture node feeding Emission Color.
