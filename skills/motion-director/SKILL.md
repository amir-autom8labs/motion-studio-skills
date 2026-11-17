---
name: motion-director
description: Plan and produce a motion clip end to end — product launch video, social media clip, feature teaser, capability demo, animated explainer, logo sting. Use this first whenever the user asks for a video, animation, motion graphic, reel or "something animated to post"; it turns the brief into a storyboard, picks the right engine per shot, and drives the build → review → render → assemble loop. Start here even if the user names a specific library.
---

# Motion director

You are producing a finished video file, not a web page. Work in this order and do not skip the review step.

## 1. Brief (ask only what you cannot infer)

Settle these five things; default the rest and say what you assumed.

| Question | Default |
|---|---|
| Where will it play? | 16:9 landscape, 1920×1080, 30 fps |
| How long? | 6–8 s for a single idea, 15–25 s for a launch reel |
| One sentence the viewer should remember | — (must have; ask) |
| Brand: colours, font, logo | ask for files/hex; otherwise propose a palette and say so |
| Sound? | yes — music bed + impacts (most feeds autoplay muted, so the clip must also read silent) |

Platform presets (`--preset`): `landscape` 1920×1080 (YouTube, site, X), `portrait` 1080×1920 (Reels, TikTok, Shorts, Stories), `square` 1080×1080 and `4x5` 1080×1350 (feed posts), `hd` 1280×720 (drafts).

## 2. Look

Decide the look before any shot exists: load the `art-direction` skill. Use the brand the user gives; if they give none, propose two or three directions with style frames and let them choose. Never fall back to the dark violet-gradient default.

## 3. Storyboard, with numbers

Write the timing first, then a shot list. One idea per shot, 2–4 s per shot; every shot has an entrance, a hold long enough to read, and an exit.

```
TIME     12 s, 30 fps = 360 frames, 1920x1080.  120 BPM: 1 beat = 15 frames, 1 bar = 60.
LOOK     editorial: paper F4EFE6, ink 161412, accent E0431E; Instrument Serif 400 / Hanken Grotesk
BANS     gradients, glow blobs, fade-and-slide on everything, zooms, any text not listed here

#  frames    shot                          engine        subject size   notes
1  0–90      logo draws on, name lands     animejs       name 38% wide  impact on frame 0
2  90–195    card expands, toggle flips    react-spring  panel 45% wide
3  195–300   "87% faster" line draws       d3            number 17% tall  number counts with the line
4  300–360   CTA + URL, hold               animejs       URL 5% tall    last frame is the thumbnail
```

Replace every adjective with a number; a vague word gets the default. These are the numbers that matter:

| Instead of | Write |
|---|---|
| smooth entrance | 600–900 ms, `cubic-bezier(0.16, 1, 0.3, 1)` (anime `outExpo`) |
| quick exit | 40–50% shorter than the entrance, ease-in |
| bouncy | spring damping ratio: 1.0 text and UI, 0.8 products and cards, 0.5 characters (`spring()` in motion-kit) |
| readable | hold = 0.3 s per word + 0.5 s after the text has stopped moving |
| staggered | characters 30–60 ms, words 60–120 ms, list items 40–80 ms; next move starts at 30–50% of the last |
| big enough | a minimum size for the subject of each shot (headline ≥ 7% of the short side, body ≥ 3%); measure it |
| on the beat | frames per beat = fps × 60 / BPM; cues are multiples of it (see `tonejs-soundtrack`) |
| energetic | cuts on the beat, never zooms or whip pans |
| punchy sound | each sound lands 1 frame after its picture event |

Other rules that hold up:
- **One clock.** Put every cue (frames) in one module and import it in both the visuals and the soundtrack, so picture and sound cannot drift.
- **One focal point** at a time; text is fully in frame or fully out, never half cut.
- **Design collisions out**: give moving things separate lanes or layers rather than fixing overlaps afterwards.
- **Fill the frame.** If it would look right as a web page it is too small. Keep content inside a 6% safe margin (10% top and bottom in portrait).
- **Size in `u()` units** (1% of the short side) so the scene renders in every aspect ratio.

## 4. Pick an engine per shot

| The shot is… | Use | Skill |
|---|---|---|
| Titles, kinetic type, logo/SVG reveal, lower thirds, anything DOM/SVG on a timeline | anime.js | `animejs-titles` |
| A product UI being used: cards, toggles, lists, modals | react-spring | `react-spring-ui` |
| Thousands of particles, glows, morphing point clouds | PixiJS | `pixi-particles` |
| Organic background plate, flow fields, generative texture | p5.js | `p5-generative` |
| Things that fall, bounce, stack, collide | matter-js | `matter-physics` |
| A number or trend that must be believed | D3 | `d3-data-stories` |
| Music, impacts, anything that must hit a beat, audio-reactive visuals | Tone.js | `tonejs-soundtrack` |
| A product or device in 3D, turntable, camera fly-around, 3D logo | three.js | `threejs-3d` |
| A photoreal hero still or short ray-traced shot | Blender (headless) | `blender-render` |
| Photoreal footage, talking head, image-to-3D model, generated music | AI models (GPU) | `ai-generated-assets` |

When in doubt use anime.js: it covers roughly 70% of launch-clip shots. Reach for the others only for what they are uniquely good at. Mixing engines inside one scene is fine (DOM title over a canvas).

## 5. Build → review → render

All mechanics are in the `render-pipeline` skill. The loop:

1. One scene file per shot. Start from the closest demo in `${CLAUDE_PLUGIN_ROOT}/demos/` rather than from scratch.
2. `motion sheet scene.js -o sheet.png --count 8` and **look at the image**. First stills are usually framed too wide and too small. Fix size, framing and look here — a sheet costs seconds, a render costs minutes.
3. Render, then **measure motion**: `motion check out.mp4`. Stills cannot show a frozen clip; this can.
4. Assemble shots with `motion concat` and lay one continuous soundtrack across the whole reel; run `motion check` on the final file.
5. Deliver every aspect ratio asked for.

## 6. Done means

A clip is finished only when all of these are true, reported with their numbers rather than "looks good":

- Final file exists at the requested size, frame rate and duration (ffprobe).
- Contact sheet of the *final* render reviewed: nothing visible before its cue, nothing cut off, subject at or above its minimum size.
- `motion check`: every freeze of 0.5 s or longer is an intended hold; each planned move shows as a bump in motion-per-second; loop seam ok if it loops.
- Loudness −14 LUFS ±2, true peak at or below −1 dBTP, measured on the encoded file.
- First frame is not blank (it becomes the thumbnail); last frame holds the CTA ≥ 1.5 s.
- Reads with the sound off.
- Any AI-generated asset: licence checked for commercial use (`ai-generated-assets`).

You cannot hear audio or watch playback. Say so, and ask the user to press play once before publishing. For a large job, have a separate agent that did not build the clip run these checks and try to break it.
