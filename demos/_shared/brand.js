// Back-compat for scenes that still import a fixed brand: the original "lumen" look.
import { looks } from './looks.js';
export const brand = { name: 'Lumen', ...looks.lumen };
export const palette = looks.lumen.palette;
export const gradient = looks.lumen.fill;
