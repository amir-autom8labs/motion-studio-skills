// Looks: the whole visual identity of a clip as one object. Scenes read tokens, never hard-code colours
// or fonts, so `--set look=bold` re-skins any scene and a reel stays consistent.
// For real work, copy one of these and replace it with the client's brand (colours, typeface, logo).
import { loadFonts } from 'motion-kit';
import instrument400 from '@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2';
import hanken400 from '@fontsource/hanken-grotesk/files/hanken-grotesk-latin-400-normal.woff2';
import hanken600 from '@fontsource/hanken-grotesk/files/hanken-grotesk-latin-600-normal.woff2';
import hanken800 from '@fontsource/hanken-grotesk/files/hanken-grotesk-latin-800-normal.woff2';
import archivoBlack from '@fontsource/archivo-black/files/archivo-black-latin-400-normal.woff2';
import bricolage700 from '@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-700-normal.woff2';
import bricolage800 from '@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff2';

const HANKEN = [{ family: 'Hanken Grotesk', src: hanken400, weight: 400 }, { family: 'Hanken Grotesk', src: hanken600, weight: 600 }, { family: 'Hanken Grotesk', src: hanken800, weight: 800 }];
const BRICOLAGE = [{ family: 'Bricolage Grotesque', src: bricolage700, weight: 700 }, { family: 'Bricolage Grotesque', src: bricolage800, weight: 800 }];
const body = `'Hanken Grotesk',system-ui,sans-serif`, mono = `'JetBrains Mono',ui-monospace,monospace`;
const flat = (c) => `linear-gradient(${c},${c})`;

// Token meanings — bg/panel/line/text/dim: surfaces and type.  a: the one accent.  b,c,d: supporting colours.
// head/hw/ht/hs: headline family, weight, tracking, and a size factor (wide faces need smaller sizes to fit the same line).  fill: paint for the emphasised headline word.
// dark: additive glow effects allowed.  glow: soft background blobs allowed.  particles: colours for point effects.
export const looks = {
  // Warm paper, serif display, one vermilion accent. Reads as print / editorial.
  editorial: { name: 'editorial', dark: false, glow: false, bg: '#f4efe6', panel: '#fbf8f2', line: 'rgba(22,20,18,.16)', text: '#161412', dim: '#6b645b',
    a: '#e0431e', b: '#161412', c: '#e0431e', d: '#b8862b', palette: ['#161412', '#e0431e', '#b8862b', '#2f5d50', '#8c3b2a', '#4a463f'],
    head: `'Instrument Serif',Georgia,serif`, hw: 400, ht: '-0.02em', hs: 1, font: body, mono, fill: flat('#e0431e'), particles: ['#161412', '#161412', '#e0431e'],
    fonts: [{ family: 'Instrument Serif', src: instrument400, weight: 400 }, ...HANKEN] },
  // Flat saturated yellow, black slab type, hard outlines. Loud, poster-like.
  bold: { name: 'bold', dark: false, glow: false, bg: '#ffd400', panel: '#fff3a6', line: 'rgba(11,11,11,.9)', text: '#0b0b0b', dim: '#4a3f00',
    a: '#1f4bff', b: '#0b0b0b', c: '#ff4b2b', d: '#ffffff', palette: ['#0b0b0b', '#ffffff', '#ff4b2b', '#1f4bff'],
    head: `'Archivo Black',Impact,sans-serif`, hw: 400, ht: '-0.03em', hs: 0.76, font: body, mono, fill: flat('#1f4bff'), particles: ['#0b0b0b', '#0b0b0b', '#1f4bff', '#ff4b2b'],
    fonts: [{ family: 'Archivo Black', src: archivoBlack, weight: 400 }, ...HANKEN] },
  // Light product UI: cool grey ground, white cards, hairlines, one blue.
  paper: { name: 'paper', dark: false, glow: false, bg: '#eceef1', panel: '#ffffff', line: 'rgba(15,23,42,.12)', text: '#0f172a', dim: '#5b6677',
    a: '#1d4ed8', b: '#1d4ed8', c: '#f25c05', d: '#0f172a', palette: ['#0f172a', '#1d4ed8', '#f25c05', '#94a3b8'],
    head: `'Hanken Grotesk',system-ui,sans-serif`, hw: 800, ht: '-0.04em', hs: 1, font: body, mono, fill: flat('#1d4ed8'), particles: ['#0f172a', '#1d4ed8'],
    fonts: HANKEN },
  // Black with a single acid-lime signal colour. For audio and tech moments.
  signal: { name: 'signal', dark: true, glow: true, bg: '#050505', panel: '#121212', line: 'rgba(255,255,255,.16)', text: '#f2f2f2', dim: '#8a8a8a',
    a: '#c6ff3d', b: '#c6ff3d', c: '#f2f2f2', d: '#7a7a7a', palette: ['#c6ff3d', '#f2f2f2', '#7a7a7a', '#e8ffb0'],
    head: `'Bricolage Grotesque',system-ui,sans-serif`, hw: 800, ht: '-0.04em', hs: 1, font: body, mono, fill: flat('#c6ff3d'), particles: ['#c6ff3d', '#f2f2f2', '#e8ffb0'],
    fonts: [...BRICOLAGE, ...HANKEN] },
  // Near-black with warm embers. For particle hero moments.
  ember: { name: 'ember', dark: true, glow: true, bg: '#0a0605', panel: '#17100d', line: 'rgba(255,240,225,.14)', text: '#fff3e6', dim: '#a8937f',
    a: '#ff6a1a', b: '#ffb347', c: '#ffe9c7', d: '#ff3d2e', palette: ['#ff6a1a', '#ffb347', '#ffe9c7', '#ff3d2e'],
    head: `'Archivo Black',Impact,sans-serif`, hw: 400, ht: '-0.02em', hs: 0.8, font: body, mono, fill: flat('#ff6a1a'), particles: ['#ff6a1a', '#ff6a1a', '#ffb347', '#ffe9c7'],
    fonts: [{ family: 'Archivo Black', src: archivoBlack, weight: 400 }, ...HANKEN] },
  // Light photographic studio sweep with one orange. For 3D product shots.
  studio: { name: 'studio', dark: false, glow: false, bg: '#e6e3dd', panel: '#f4f2ee', line: 'rgba(20,20,20,.14)', text: '#141414', dim: '#66625c',
    a: '#ff5a1f', b: '#141414', c: '#ff5a1f', d: '#8f8a82', palette: ['#141414', '#ff5a1f', '#8f8a82'],
    head: `'Bricolage Grotesque',system-ui,sans-serif`, hw: 700, ht: '-0.045em', hs: 0.873, font: body, mono, fill: flat('#ff5a1f'), particles: ['#141414', '#ff5a1f'],
    fonts: [...BRICOLAGE, ...HANKEN] },
  // The original dark violet-to-cyan look. Kept as the reference for what an undirected default looks like.
  lumen: { name: 'lumen', dark: true, glow: true, bg: '#07080d', panel: '#11131c', line: 'rgba(255,255,255,0.09)', text: '#f4f5fa', dim: '#8b90a6',
    a: '#7c5cff', b: '#22d3ee', c: '#ff5c8a', d: '#ffc24b', palette: ['#7c5cff', '#22d3ee', '#ff5c8a', '#ffc24b', '#5eead4', '#a78bfa'],
    head: `'Inter Display','Inter',system-ui,sans-serif`, hw: 800, ht: '-0.04em', hs: 1, font: `'Inter Display','Inter',system-ui,sans-serif`, mono,
    fill: 'linear-gradient(100deg, #7c5cff, #22d3ee)', particles: ['#7c5cff', '#22d3ee', '#ff5c8a', '#ffffff'], fonts: [] },
};

// Resolve the look for a scene (`--set look=name` overrides the scene's default), paint the stage and load its fonts.
export async function useLook({ root, params, transparent }, fallback) {
  const look = looks[params?.look ?? fallback] ?? looks[fallback];
  if (root && !transparent) root.style.background = look.bg;
  await loadFonts(look.fonts);
  return { ...look, gradient: look.fill };
}
