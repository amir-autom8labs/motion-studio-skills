// Audio-only scene: `motion render soundtrack.js -o reel.wav --duration <reel length>`
import { score } from '../_shared/music.js';
export const config = { duration: 24 };
export const audio = (ctx) => score(ctx);
export default function scene() {}
