// Shared look for all demos: a fictional product, "Lumen".
export const brand = {
  name: 'Lumen',
  bg: '#07080d',
  panel: '#11131c',
  line: 'rgba(255,255,255,0.09)',
  text: '#f4f5fa',
  dim: '#8b90a6',
  a: '#7c5cff', // violet
  b: '#22d3ee', // cyan
  c: '#ff5c8a', // pink
  d: '#ffc24b', // amber
  font: `'Inter Display','Inter',system-ui,sans-serif`,
  mono: `'JetBrains Mono',ui-monospace,monospace`,
};
export const palette = [brand.a, brand.b, brand.c, brand.d, '#5eead4', '#a78bfa'];
export const gradient = `linear-gradient(100deg, ${brand.a}, ${brand.b})`;
