// Tone.js soundtrack rendered offline (faster than real time, sample-accurate, no speakers needed).
// 120 bpm, Am–F–C–G. Bar 1 is sparse, drums enter on bar 2, an impact lands on every 4-bar boundary.
import * as Tone from 'tone';

export const BPM = 120;
export const BEAT = 60 / BPM;      // 0.5 s
export const BAR = BEAT * 4;       // 2 s

const CHORDS = [['A2', 'A3', 'C4', 'E4'], ['F2', 'A3', 'C4', 'F4'], ['C3', 'G3', 'C4', 'E4'], ['G2', 'G3', 'B3', 'D4']];
const ARP = [['A4', 'C5', 'E5', 'C5'], ['A4', 'C5', 'F5', 'C5'], ['G4', 'C5', 'E5', 'C5'], ['G4', 'B4', 'D5', 'B4']];

export function score({ duration }) {
  return Tone.Offline(({ transport }) => {
    transport.bpm.value = BPM;
    const master = new Tone.Gain(0.9).toDestination();
    const limiter = new Tone.Limiter(-2).connect(master);
    const verb = new Tone.Freeverb({ roomSize: 0.82, dampening: 2600, wet: 0.28 }).connect(limiter);

    const pad = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'fatsawtooth', count: 3, spread: 24 }, envelope: { attack: 0.5, decay: 0.3, sustain: 0.7, release: 1.4 } });
    pad.connect(new Tone.Filter(1400, 'lowpass').connect(verb)); pad.volume.value = -19;
    const delay = new Tone.FeedbackDelay('8n.', 0.32).connect(verb); delay.wet.value = 0.3;
    const arp = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.16, sustain: 0.05, release: 0.2 } }).connect(delay); arp.volume.value = -13;
    const bass = new Tone.MonoSynth({ oscillator: { type: 'square' }, filter: { Q: 2, type: 'lowpass' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.15 },
      filterEnvelope: { attack: 0.01, decay: 0.15, sustain: 0.2, baseFrequency: 90, octaves: 2.6 } }).connect(limiter); bass.volume.value = -13;
    const kick = new Tone.MembraneSynth({ pitchDecay: 0.04, octaves: 7, envelope: { attack: 0.001, decay: 0.32, sustain: 0 } }).connect(limiter); kick.volume.value = -5;
    const hat = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.045, sustain: 0 } });
    hat.connect(new Tone.Filter(7500, 'highpass').connect(limiter)); hat.volume.value = -22;
    const clap = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.002, decay: 0.16, sustain: 0 } });
    clap.connect(new Tone.Filter(1800, 'bandpass').connect(verb)); clap.volume.value = -13;
    const boom = new Tone.MembraneSynth({ pitchDecay: 0.25, octaves: 5, envelope: { attack: 0.001, decay: 1.6, sustain: 0 } }).connect(verb); boom.volume.value = -5;
    const riser = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: BAR * 0.95, decay: 0.05, sustain: 0 } });
    const sweep = new Tone.Filter(300, 'bandpass'); riser.connect(sweep); sweep.connect(verb); riser.volume.value = -17;

    const bars = Math.ceil(duration / BAR);
    for (let b = 0; b < bars; b++) {
      const t0 = b * BAR, c = b % 4;
      transport.schedule((t) => pad.triggerAttackRelease(CHORDS[c].slice(1), BAR * 0.95, t), t0);
      for (let s = 0; s < 8; s++) transport.schedule((t) => arp.triggerAttackRelease(ARP[c][s % 4], '16n', t, 0.5 + 0.5 * ((s + 1) % 2)), t0 + s * BEAT / 2);
      if (b >= 1) {
        for (let q = 0; q < 4; q++) {
          transport.schedule((t) => kick.triggerAttackRelease('C1', '8n', t), t0 + q * BEAT);
          transport.schedule((t) => hat.triggerAttackRelease('32n', t, 0.8), t0 + q * BEAT + BEAT / 2);
          transport.schedule((t) => bass.triggerAttackRelease(CHORDS[c][0], '8n', t, 0.9), t0 + q * BEAT + BEAT / 2);
        }
        transport.schedule((t) => clap.triggerAttackRelease('16n', t), t0 + BEAT);
        transport.schedule((t) => clap.triggerAttackRelease('16n', t), t0 + 3 * BEAT);
      }
      if (b % 4 === 3 && t0 + BAR < duration - 0.5) { // riser into the next 4-bar phrase, impact on its downbeat
        transport.schedule((t) => { riser.triggerAttackRelease(BAR, t); sweep.frequency.setValueAtTime(300, t); sweep.frequency.exponentialRampToValueAtTime(9000, t + BAR); }, t0);
        transport.schedule((t) => boom.triggerAttackRelease('A0', 1.5, t), t0 + BAR);
      }
    }
    transport.schedule((t) => boom.triggerAttackRelease('A0', 1.5, t), 0.01);
    master.gain.setValueAtTime(0.9, Math.max(0, duration - 0.9));
    master.gain.linearRampToValueAtTime(0, duration);
    transport.start(0);
  }, duration, 2, 48000);
}
