// D3 — an animated chart that tells one story: the line draws on, the annotation lands,
// the headline number counts up. Uses plain d3 transitions (d3-timer runs on the virtual clock).
import * as d3 from 'd3';
import { unit, el, css } from 'motion-kit';
import { brand, gradient } from '../_shared/brand.js';

export const config = { width: 1920, height: 1080, fps: 30, duration: 7, background: brand.bg };
const DATA = [48, 46, 47, 41, 38, 39, 31, 24, 19, 13, 9, 6].map((v, i) => ({ v, label: `v1.${i}` }));
DATA[11].label = 'v2.0';

export default function scene({ root, width, height }) {
  const u = unit(width, height), portrait = height > width;
  css(root, `.hd{position:absolute;left:${u(9)}px;top:${u(8)}px;font-family:${brand.font};color:${brand.text}}
    .k{font:600 ${u(2.5)}px ${brand.mono};letter-spacing:.28em;color:${brand.b}}
    .h{font-weight:800;font-size:${u(7.6)}px;letter-spacing:-.035em;margin-top:${u(1.6)}px}
    .big{position:absolute;right:${u(9)}px;top:${u(6)}px;text-align:right;font-family:${brand.font}}
    .big .n{font-weight:800;font-size:${u(17)}px;letter-spacing:-.05em;line-height:1;background:${gradient};-webkit-background-clip:text;color:transparent;font-variant-numeric:tabular-nums}
    .big .s{font-size:${u(3.3)}px;color:${brand.dim};margin-top:${u(.6)}px}
    text{font-family:${brand.font};fill:${brand.dim};font-size:${u(2.7)}px}`);
  const hd = d3.select(root).append('div').attr('class', 'hd').style('opacity', 0);
  hd.append('div').attr('class', 'k').text('RENDER TIME PER RELEASE');
  hd.append('div').attr('class', 'h').text('Twelve releases. One direction.');
  const big = d3.select(root).append('div').attr('class', 'big').style('opacity', 0);
  if (portrait) big.style('top', `${u(34)}px`);
  const num = big.append('div').attr('class', 'n').text('0%');
  big.append('div').attr('class', 's').text('faster than v1.0');

  const m = { l: u(15), r: u(11), t: portrait ? u(62) : u(34), b: u(13) };
  const svg = d3.select(root).append('svg').attr('width', width).attr('height', height).style('position', 'absolute').style('inset', 0);
  const x = d3.scalePoint().domain(DATA.map((d) => d.label)).range([m.l, width - m.r]);
  const y = d3.scaleLinear().domain([0, 50]).range([height - m.b, m.t]);

  const defs = svg.append('defs');
  const lg = defs.append('linearGradient').attr('id', 'stroke').attr('x1', 0).attr('x2', 1);
  lg.append('stop').attr('offset', 0).attr('stop-color', brand.c); lg.append('stop').attr('offset', 1).attr('stop-color', brand.b);
  const ag = defs.append('linearGradient').attr('id', 'area').attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y2', 1);
  ag.append('stop').attr('offset', 0).attr('stop-color', brand.a).attr('stop-opacity', 0.45); ag.append('stop').attr('offset', 1).attr('stop-color', brand.a).attr('stop-opacity', 0);
  const clip = defs.append('clipPath').attr('id', 'reveal').append('rect').attr('x', 0).attr('y', 0).attr('height', height).attr('width', m.l);

  // grid
  const grid = svg.append('g').style('opacity', 0);
  for (const v of [0, 10, 20, 30, 40, 50]) {
    grid.append('line').attr('x1', m.l).attr('x2', width - m.r).attr('y1', y(v)).attr('y2', y(v)).attr('stroke', brand.line);
    grid.append('text').attr('x', m.l - u(2)).attr('y', y(v)).attr('text-anchor', 'end').attr('dominant-baseline', 'middle').text(`${v}s`);
  }
  DATA.forEach((d, i) => { if (!portrait || i % 2 === 1) grid.append('text').attr('x', x(d.label)).attr('y', height - m.b + u(4)).attr('text-anchor', 'middle').text(d.label); });

  const line = d3.line().x((d) => x(d.label)).y((d) => y(d.v)).curve(d3.curveMonotoneX);
  const area = d3.area().x((d) => x(d.label)).y0(y(0)).y1((d) => y(d.v)).curve(d3.curveMonotoneX);
  svg.append('path').attr('d', area(DATA)).attr('fill', 'url(#area)').attr('clip-path', 'url(#reveal)');
  const path = svg.append('path').attr('d', line(DATA)).attr('fill', 'none').attr('stroke', 'url(#stroke)')
    .attr('stroke-width', u(0.9)).attr('stroke-linecap', 'round');
  const len = path.node().getTotalLength();
  path.attr('stroke-dasharray', len).attr('stroke-dashoffset', len);
  const dots = svg.append('g').selectAll('circle').data(DATA).join('circle')
    .attr('cx', (d) => x(d.label)).attr('cy', (d) => y(d.v)).attr('r', 0).attr('fill', brand.bg).attr('stroke', brand.text).attr('stroke-width', u(0.45));

  // annotation on the last point
  const last = DATA[DATA.length - 1];
  const note = svg.append('g').attr('transform', `translate(${x(last.label)},${y(last.v)})`).style('opacity', 0);
  note.append('circle').attr('r', u(3.2)).attr('fill', 'none').attr('stroke', brand.b).attr('stroke-width', u(0.3));
  const ny = portrait ? u(46) : u(11), nx = portrait ? -u(2) : u(9); // portrait: the line is steeper, lift the label clear of it
  note.append('line').attr('x1', portrait ? 0 : -u(2.6)).attr('y1', portrait ? -u(3.4) : -u(2.6)).attr('x2', -nx).attr('y2', -ny).attr('stroke', brand.b).attr('stroke-width', u(0.3));
  note.append('text').attr('x', -nx - u(1)).attr('y', -ny - u(4.4)).attr('text-anchor', 'end').style('fill', brand.text).style('font-size', `${u(3.4)}px`).style('font-weight', 700).text('6 s per render');
  note.append('text').attr('x', -nx - u(1)).attr('y', -ny - u(0.8)).attr('text-anchor', 'end').text('GPU pipeline ships in v2.0');

  // choreography
  const DRAW = 2600, T0 = 900;
  hd.transition().duration(700).delay(150).style('opacity', 1);
  grid.transition().duration(700).delay(450).style('opacity', 1);
  path.transition().delay(T0).duration(DRAW).ease(d3.easeCubicInOut).attr('stroke-dashoffset', 0);
  clip.transition().delay(T0).duration(DRAW).ease(d3.easeCubicInOut).attr('width', width);
  dots.transition().delay((d, i) => T0 + 250 + (i / (DATA.length - 1)) * (DRAW - 500)).duration(500).ease(d3.easeBackOut.overshoot(3)).attr('r', u(0.9));
  big.transition().delay(T0).duration(500).style('opacity', 1);
  num.transition().delay(T0).duration(DRAW + 300).ease(d3.easeCubicInOut)
    .tween('text', () => { const i = d3.interpolateNumber(0, 87); return (k) => num.text(`${Math.round(i(k))}%`); });
  note.transition().delay(T0 + DRAW - 100).duration(600).ease(d3.easeBackOut).style('opacity', 1);
  note.select('circle').transition().delay(T0 + DRAW - 100).duration(900).ease(d3.easeElasticOut).attrTween('r', () => d3.interpolateNumber(0, u(3.2)));
}
