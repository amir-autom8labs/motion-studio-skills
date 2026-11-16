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

## 2. Storyboard

Write a shot list before any code. One idea per shot, 2–4 s per shot, every shot has an entrance, a hold long enough to read, and an exit.

```
#  time      shot                         engine        notes
1  0.0–3.0   Logo draws on, name lands    animejs       impact on downbeat at 0.0
2  3.0–6.5   UI: card expands, toggle on  react-spring
3  6.5–10    "87% faster" chart draws     d3            number counts with the line
4  10–12     CTA + URL                    animejs
```

Rules that make it look professional:
- **Reading time**: on-screen text needs ≥ 0.3 s per word after it has finished animating, minimum 1 s.
- **Cut on the beat**: at 120 bpm a beat is 0.5 s and a bar is 2 s. Make shot lengths multiples of a beat and land entrances on beats (see `tonejs-soundtrack`).
- **One focal point** at a time. Stagger entrances 40–80 ms apart; never bring in everything at once.
- **Ease out to enter, ease in to exit.** Entrances 500–900 ms, exits 300–500 ms. Linear motion only for continuous drift.
- **Fill the frame.** Video is watched small. Headline ≥ 7% of the short side, body ≥ 3%, nothing important under 2.4%. If it would look right as a web page it is too small. Keep content inside a 6% safe margin (10% top/bottom for portrait, where platform UI overlaps).
- **Size in `u()` units** (1% of the short side) so the same scene renders in every aspect ratio.

## 3. Pick an engine per shot

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

## 4. Build → review → render

All mechanics are in the `render-pipeline` skill. The loop:

1. One scene file per shot. Start from the closest demo in `${CLAUDE_PLUGIN_ROOT}/demos/` rather than from scratch.
2. `motion sheet scene.js -o sheet.png --count 8` and **look at the image**. Check: is anything visible before it should be? Text too small? Overlaps? Empty frame? Does the last frame exit cleanly?
3. Fix and repeat until the sheet is right. Only then render the video.
4. Assemble shots with `motion concat` and lay one continuous soundtrack across the whole reel.
5. Deliver every aspect ratio asked for, and tell the user the file paths, durations and sizes.

## 5. Before you hand over

- Watched the contact sheet of the *final* render, not just the drafts.
- First frame is not blank-black for more than ~0.3 s (feeds use it as the thumbnail); last frame holds the CTA ≥ 1.5 s.
- Clip reads with sound off.
- Any AI-generated asset: licence checked for commercial use (see `ai-generated-assets`).
