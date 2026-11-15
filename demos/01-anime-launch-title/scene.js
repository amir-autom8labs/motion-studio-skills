// anime.js — kinetic-typography launch title. Timeline-driven DOM + SVG.
import { createTimeline, animate, stagger, splitText, svg, utils } from 'animejs';
import { el, css, unit } from 'motion-kit';
import { brand, gradient } from '../_shared/brand.js';

export const config = { width: 1920, height: 1080, fps: 30, duration: 6, background: brand.bg };

export default function scene({ root, width, height }) {
  const u = unit(width, height);
  css(root, `
    .stage{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
      font-family:${brand.font};color:${brand.text}}
    .blob{position:absolute;border-radius:50%;opacity:.6} /* soft blobs via gradient: a large CSS blur() made this scene render 1.5x slower */
    .pill{font:600 ${u(2.4)}px ${brand.mono};letter-spacing:.32em;color:${brand.b};padding:${u(1)}px ${u(2.2)}px;
      border:1px solid ${brand.line};border-radius:999px;background:rgba(255,255,255,.03);opacity:0}
    .word{font-weight:800;font-size:${u(26)}px;line-height:1;letter-spacing:-.045em;margin-top:${u(3)}px;display:flex;align-items:center;gap:${u(3)}px}
    .word .grad{background:${gradient};-webkit-background-clip:text;color:transparent;padding:0 .04em .1em}
    .rule{height:${u(.5)}px;width:${u(60)}px;background:${gradient};border-radius:9px;transform:scaleX(0);margin-top:${u(1)}px}
    .tag{font-weight:500;font-size:${u(4.4)}px;color:${brand.dim};margin-top:${u(4)}px;letter-spacing:-.01em}
    .tag b{color:${brand.text};font-weight:600}
    .cta{margin-top:${u(5)}px;font:600 ${u(3.2)}px ${brand.font};padding:${u(2)}px ${u(4.2)}px;border-radius:999px;
      background:${brand.text};color:${brand.bg};opacity:0}
  `);
  const blobA = el('div', { class: 'blob', style: `width:${u(100)}px;height:${u(100)}px;background:radial-gradient(closest-side, ${brand.a}, transparent);left:${width * 0.02}px;top:${height * -0.1}px` }, root);
  const blobB = el('div', { class: 'blob', style: `width:${u(90)}px;height:${u(90)}px;background:radial-gradient(closest-side, ${brand.b}, transparent);left:${width * 0.52}px;top:${height * 0.3}px;opacity:.4` }, root);
  const stage = el('div', { class: 'stage' }, root);
  const pill = el('div', { class: 'pill' }, stage, 'INTRODUCING');
  const word = el('div', { class: 'word' }, stage);
  const logo = el('svg', { viewBox: '0 0 100 100', width: u(20), height: u(20), fill: 'none' }, word);
  const defs = el('defs', {}, logo);
  const lg = el('linearGradient', { id: 'lg', x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
  el('stop', { offset: 0, 'stop-color': brand.a }, lg); el('stop', { offset: 1, 'stop-color': brand.b }, lg);
  const ring = el('path', { d: 'M50 8 A42 42 0 1 1 49.9 8', stroke: 'url(#lg)', 'stroke-width': 9, 'stroke-linecap': 'round' }, logo);
  const bolt = el('path', { d: 'M56 22 L34 54 H50 L44 78 L68 44 H52 Z', fill: 'url(#lg)', opacity: 0, style: 'transform-origin:50px 50px' }, logo);
  const name = el('span', {}, word, brand.name);
  const ver = el('span', { class: 'grad' }, word, '2.0');
  const rule = el('div', { class: 'rule' }, stage);
  const tag = el('div', { class: 'tag' }, stage);
  tag.innerHTML = 'Ship motion at the <b>speed of thought</b>';
  const cta = el('div', { class: 'cta' }, stage, 'Available today  →');

  const chars = splitText(name, { chars: true }).chars;
  const words = splitText(tag, { words: true }).words;
  const [drawRing] = svg.createDrawable(ring);
  // Timeline children only apply their `from` values when they start: hide everything up front.
  utils.set([...chars, ver, ...words], { opacity: 0 });
  utils.set(drawRing, { draw: '0 0' });

  // ambient drift, independent of the main timeline
  animate(blobA, { x: u(18), y: u(10), scale: 1.15, duration: 6000, ease: 'inOutSine' });
  animate(blobB, { x: -u(22), y: -u(8), scale: 0.9, duration: 6000, ease: 'inOutSine' });

  createTimeline({ defaults: { ease: 'outExpo' } })
    .add(pill, { opacity: [0, 1], y: [u(2), 0], duration: 700 }, 150)
    .add(drawRing, { draw: ['0 0', '0 1'], duration: 1100, ease: 'inOutQuart' }, 350)
    .add(bolt, { opacity: [0, 1], scale: [0.2, 1], rotate: [-40, 0], duration: 900, ease: 'outBack(2)' }, 950)
    .add(chars, { y: [u(16), 0], opacity: [0, 1], rotateX: [-80, 0], filter: ['blur(12px)', 'blur(0px)'], duration: 1000, delay: stagger(55) }, 600)
    .add(ver, { opacity: [0, 1], x: [-u(4), 0], scale: [0.8, 1], duration: 900, ease: 'outBack(1.6)' }, 1150)
    .add(rule, { scaleX: [0, 1], duration: 1100, ease: 'inOutExpo' }, 1300)
    .add(words, { opacity: [0, 1], y: [u(3), 0], duration: 800, delay: stagger(70) }, 1900)
    .add(cta, { opacity: [0, 1], y: [u(2.5), 0], scale: [0.92, 1], duration: 800, ease: 'outBack(1.4)' }, 3000)
    .add(cta, { scale: [1, 1.06, 1], duration: 600, ease: 'inOutSine' }, 4000)
    // exit
    .add([pill, rule, tag, cta], { opacity: 0, y: -u(3), duration: 500, ease: 'inQuart', delay: stagger(40) }, 5050)
    .add(word, { scale: 1.12, opacity: 0, filter: ['blur(0px)', 'blur(16px)'], duration: 600, ease: 'inQuart' }, 5300);
}
