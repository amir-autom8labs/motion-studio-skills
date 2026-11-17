// Transparent overlay — render with --transparent to .mov (ProRes 4444) or .webm (VP9 alpha) and
// composite over any footage: screen recordings, AI-generated video, a generative plate.
import { createTimeline, splitText, utils, stagger } from 'animejs';
import { el, css, unit, rgba } from 'motion-kit';
import { useLook, looks } from '../_shared/looks.js';

export const config = { width: 1920, height: 1080, fps: 30, duration: 5, background: 'transparent' };

export default async function scene(sceneCtx) {
  const { root, width, height, params } = sceneCtx;
  const brand = await useLook(sceneCtx, 'editorial');
  const { gradient, palette } = brand;
  const u = unit(width, height);
  css(root, `.lt{position:absolute;left:${u(7)}px;bottom:${u(9)}px;font-family:${brand.font};color:${brand.text}}
    .bar{position:absolute;left:0;top:0;bottom:0;width:${u(0.9)}px;border-radius:9px;background:${gradient};transform-origin:50% 100%}
    .box{margin-left:${u(3)}px;padding:${u(2.4)}px ${u(4)}px ${u(2.6)}px ${u(3)}px;background:${rgba(brand.bg, 0.86)};border-radius:${u(1.6)}px;
      backdrop-filter:blur(18px);border:1px solid ${brand.line};clip-path:inset(0 100% 0 0 round ${u(1.6)}px)}
    .n{font-family:${brand.head};font-weight:${brand.hw};font-size:${u(6.6)}px;letter-spacing:${brand.ht};line-height:1.05}
    .r{font:500 ${u(3)}px ${brand.font};color:${brand.a};margin-top:${u(0.8)}px}`);
  const lt = el('div', { class: 'lt' }, root);
  const bar = el('div', { class: 'bar' }, lt);
  const box = el('div', { class: 'box' }, lt);
  const name = el('div', { class: 'n' }, box, params.title ?? 'Generative plates');
  const role = el('div', { class: 'r' }, box, params.subtitle ?? 'p5.js flow field · rendered at 30 fps');
  const chars = splitText(name, { chars: true }).chars;
  utils.set(bar, { scaleY: 0 }); utils.set([...chars, role], { opacity: 0 });

  createTimeline({ defaults: { ease: 'outExpo' } })
    .add(bar, { scaleY: [0, 1], duration: 600 }, 200)
    .add(box, { clipPath: [`inset(0 100% 0 0 round ${u(1.6)}px)`, `inset(0 0% 0 0 round ${u(1.6)}px)`], duration: 900 }, 400)
    .add(chars, { opacity: [0, 1], x: [-u(2), 0], duration: 600, delay: stagger(18) }, 600)
    .add(role, { opacity: [0, 1], y: [u(1.5), 0], duration: 600 }, 950)
    .add(box, { clipPath: `inset(0 100% 0 0 round ${u(1.6)}px)`, duration: 600, ease: 'inExpo' }, 4000)
    .add(bar, { scaleY: 0, duration: 400, ease: 'inExpo' }, 4450);
}
