# motion-studio and HyperFrames

[HyperFrames](https://github.com/heygen-com/hyperframes) is HeyGen's Apache-2.0 framework for rendering HTML compositions to video, with its own agent skills. This note is based on reading its repository docs; it was not run.

## Where they overlap

Both render browser animation frame by frame in headless Chrome and encode with FFmpeg, both output MP4 / WebM / ProRes-alpha / GIF, both support parallel workers and supersampling. HyperFrames goes further: Docker-pinned output, cloud rendering, text-to-speech, transcription and captions, beat detection, a catalog of ready-made blocks and transitions, a preview studio.

## The difference that decides which to use

| | motion-studio | HyperFrames |
|---|---|---|
| How time works | Virtual clock: `requestAnimationFrame`, timers and `performance.now` are replaced, libraries run unmodified | Seek-based: every animation must be a paused, seekable timeline; no `requestAnimationFrame` loops or timers |
| Stateful animation (springs, physics, accumulating trails) | Works | Must be pre-simulated or rewritten as a function of time |
| Skills organised by | Animation library and craft | Workflow (contract, CLI, catalog, media) |
| Audio | Composed in code (Tone.js offline), loudness fed back to visuals | Audio files mixed in; TTS and transcription built in |

## Using them together

- **HyperFrames as the main pipeline** for titles, HTML/CSS UI, charts, transitions, voiceover and captions.
- **motion-studio for what it can't seek**: react-spring UI, matter-js physics, p5 trails, and Tone.js soundtracks. Render those to MP4/WAV here and place them in a HyperFrames composition as `<video>`/`<audio>` clips.
- **Seekable scenes port directly**: demos marked `seekable: true` (PixiJS, three.js, the Tone visualiser) are already pure functions of time and map onto HyperFrames' seek event; anime.js and D3 scenes need their timelines paused and registered.
- The per-library skills here (easing, sizing, lighting, mixing) apply regardless of which renderer produces the frames.
