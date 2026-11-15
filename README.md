# motion-studio

A Claude Code plugin for producing motion clips — product launch videos, social posts, capability demos — from code. It ships:

- **`toolkit/`** — `motion`, a headless renderer that turns any JavaScript animation into frame-perfect MP4 / WebM / GIF / ProRes-with-alpha, with Tone.js audio mixed in.
- **`skills/`** — ten skills that teach Claude how to plan a clip, pick the right engine per shot, avoid the defects we hit, and review its own work.
- **`demos/`** — nine working scenes with rendered output; the skills use them as templates.
- **`docs/PRIORITIES.md`** — how the 14 candidate packages were ranked and what the demos taught us.

## Install

```bash
claude plugin marketplace add amir-autom8labs/motion-studio-skills
```

```bash
claude plugin install motion-studio@motion-studio-skills
```

Requirements: Node 20+, ffmpeg, and Playwright's Chromium. Then once:

```bash
npm ci --prefix <plugin-root>/toolkit
```

`node <plugin-root>/toolkit/motion.mjs doctor` checks everything and prints the fix for whatever is missing.

## Skills

| Skill | Use it for |
|---|---|
| `motion-director` | Start here: brief → storyboard → engine per shot → build/review/render loop |
| `render-pipeline` | Scene contract, CLI, formats, determinism rules, speed, troubleshooting |
| `animejs-titles` | Titles, kinetic type, logo reveals, lower thirds |
| `react-spring-ui` | Product UI walkthroughs on spring physics |
| `pixi-particles` | Particle hero shots and WebGL FX |
| `p5-generative` | Generative background plates |
| `matter-physics` | Falling, stacking, colliding objects |
| `d3-data-stories` | Animated charts and counting numbers |
| `tonejs-soundtrack` | Music, impacts, beat sync, audio-reactive visuals |
| `ai-generated-assets` | Integrating LTX-2, LivePortrait, TRELLIS/Hunyuan3D, MusicGen, RIFE — with licence limits |

## Try it without the plugin

```bash
node toolkit/motion.mjs sheet demos/01-anime-launch-title/scene.js -o sheet.png --count 8
```

```bash
node toolkit/motion.mjs render demos/01-anime-launch-title/scene.js -o title.mp4 --preset portrait
```

## Status and limits

- Everything in `skills/` except `ai-generated-assets` was exercised on a 4-core, GPU-less Linux machine; the demo outputs in `demos/out/` are those renders.
- The AI models (LTX-2, LivePortrait, Hunyuan3D-2, TRELLIS, MusicGen, RIFE) were **not run**. That skill documents GPU needs, licence limits read from each repo, and how their outputs plug into the pipeline.
- The soundtrack was verified by level meters and waveform only — it has not been listened to.
- The plugin install path has not been tested with `claude plugin install`; the manifest follows the documented layout.
