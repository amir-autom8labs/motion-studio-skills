---
name: tonejs-soundtrack
description: Compose and render a soundtrack in code with Tone.js — music beds, beats, risers, impacts, whooshes and UI sounds — mixed into the video, with visuals cut to the beat or reacting to the audio. Use whenever a clip needs sound, when animation timing should follow a tempo, for audio-reactive visualisers, or to add an external music file and sync motion to it.
---

# Tone.js soundtrack and sync

Templates: `${CLAUDE_PLUGIN_ROOT}/demos/_shared/music.js` (a full 120 bpm bed: pad, arp, bass, kick, hats, claps, riser, impact), `demos/07-tone-audio-reactive/scene.js` (visuals driven by the audio), `demos/09-launch-reel/` (one soundtrack across a multi-clip reel).

## How audio gets into the video

Export `audio` from the scene. The renderer runs it in a separate page, takes the returned buffer, muxes it, **and passes a per-frame loudness analysis back to the visual scene**.

```js
import * as Tone from 'tone';

export const audio = ({ duration }) => Tone.Offline(({ transport }) => {
  transport.bpm.value = 120;
  const out  = new Tone.Limiter(-2).toDestination();
  const kick = new Tone.MembraneSynth({ pitchDecay: 0.04, octaves: 7, envelope: { attack: 0.001, decay: 0.32, sustain: 0 } }).connect(out);
  for (let b = 0; b * 0.5 < duration; b++) transport.schedule((t) => kick.triggerAttackRelease('C1', '8n', t), b * 0.5);
  transport.start(0);
}, duration, 2, 48000);

export default function scene({ audio, fps }) {
  return (t, frame) => {
    const level = audio?.level[frame] ?? 0;   // 0..1 overall loudness this frame
    const bass  = audio?.bass[frame]  ?? 0;   // 0..1 energy below ~140 Hz (kick, bass)
  };
}
```

`Tone.Offline` renders faster than real time with no audio device. `motion render scene.js -o track.wav` writes audio only. `--audio file.wav` uses an external track instead (licensed music, MusicGen output) and gives the scene the same `level`/`bass` analysis.

## What matters

- **Schedule with `transport.schedule(cb, seconds)`** and use the callback's `t` for every trigger. Never `setTimeout` or `Tone.now()`.
- **Tempo grid drives the edit.** Export `BPM`, `BEAT = 60/BPM`, `BAR = 4*BEAT` from the music module and import them in visual scenes so cues are `3 * BAR`, not `6.0`. At 120 bpm: beat 0.5 s, bar 2 s — an 8 s clip is exactly 4 bars.
- **Arrangement in 4-bar phrases**: bar 1 sparse (pad + arp), drums enter bar 2, a noise riser through bar 4 into an impact on the next downbeat. Put the hero visual on that downbeat.
- **Impacts sell cuts**: a low `MembraneSynth` hit (long pitch decay, 1.5 s decay) through reverb at every shot change; a filtered-noise sweep leading into it.
- **Mix**: everything through one `Limiter(-2)`. Kick −5 dB, bass −13, pad −19, hats −22. Fade the master over the last 0.8 s. The renderer then normalises to **−14 LUFS integrated, true peak −2 dBTP** (the level social platforms expect); `motion check out.mp4` reports both, measured on the encoded file because AAC raises peaks. Before this was added the demo mix measured −16.6 LUFS with a −0.5 dB peak.
- **Sound follows picture by one frame**: schedule each hit at its visual cue plus `1 / fps`. The eye sees the impact, the ear confirms it; sound that leads feels wrong.
- **Use `Freeverb`, not `Tone.Reverb`**, inside Offline (Reverb builds its impulse asynchronously).
- **Audio-reactive visuals**: drive scale/glow from `bass`, detail from `level`; smooth by averaging the last 2–3 frames, and read `level[frame - k]` for elements further from the centre so energy ripples outward. Keep the scene a pure function of `(t, audio)` and set `seekable: true`.
- **One soundtrack per reel**: render clips silent, then render a single track for the total length and attach it in `motion concat --audio` (see `demos/09-launch-reel/build.sh`). Per-clip music restarts at every cut.
- **UI sounds**: short `Synth` blips (triangle, 5 ms attack, 80 ms decay) at the same millisecond values as the visual steps — share one cue array between `audio` and the scene.
- You cannot hear the result. Verify levels with `motion check`, look at `ffmpeg -i out.mp4 -filter_complex showwavespic -frames:v 1 wave.png`, and tell the user the audio is unreviewed by ear.
