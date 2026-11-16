#!/usr/bin/env node
// motion — deterministic headless renderer for JS animation scenes.
//   motion render <scene.js> -o out.mp4 [options]
//   motion sheet  <scene.js> -o sheet.png [--at 0.5,2,4 | --count 8]
//   motion concat a.mp4 b.mp4 ... -o out.mp4 [--xfade 0.4] [--audio track.wav]
//   motion doctor
import { createRequire } from 'node:module';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const PRESETS = {
  landscape: [1920, 1080], portrait: [1080, 1920], square: [1080, 1080],
  '4x5': [1080, 1350], hd: [1280, 720],
};

const HELP = `motion — render JS animation scenes to video

  motion render <scene.js> -o out.mp4
      --size 1920x1080 | --preset landscape|portrait|square|4x5|hd
      --fps 30            --duration 6        --scale 1 (2 = supersample / 4K from 1080p layout)
      --from 0 --to 6     render a time range only
      --workers N         parallel browsers (default: auto)
      --audio file.wav    external soundtrack (overrides the scene's audio export)
      --no-audio          skip the scene's audio export
      --transparent       alpha output (use .mov -> ProRes 4444, or .webm -> VP9 alpha)
      --lossless          PNG frames instead of JPEG (slower, exact)
      --crf 18            quality (lower = better; use 24-28 for dense particle footage)     --seed 1
      --allow-network     let the scene fetch remote URLs (blocked by default for reproducibility)
      --verbose           print the page's console output
      --set key=value     passed to the scene as params.key (repeatable)
      output type by extension: .mp4 .webm .mov .gif, or a directory/ for a PNG sequence
  motion sheet <scene.js> -o sheet.png [--at 0.5,2,4 | --count 8] [--cols 4]   contact sheet for review
  motion concat a.mp4 b.mp4 -o out.mp4 [--xfade 0.4] [--audio track.wav]
  motion doctor           check node deps, browser, ffmpeg
`;

function parseArgs(argv) {
  const out = { _: [], set: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-o') out.o = argv[++i];
    else if (a === '--set') { const [k, ...v] = argv[++i].split('='); out.set[k] = coerce(v.join('=')); }
    else if (a.startsWith('--no-')) out[a.slice(5)] = false;
    else if (a.startsWith('--')) {
      const k = a.slice(2);
      if (i + 1 < argv.length && !argv[i + 1].startsWith('--') && argv[i + 1] !== '-o') out[k] = argv[++i];
      else out[k] = true;
    } else out._.push(a);
  }
  return out;
}
const coerce = (v) => (v === 'true' ? true : v === 'false' ? false : v !== '' && !isNaN(v) ? +v : v);
const die = (m) => { console.error(`motion: ${m}`); process.exit(1); };

function loadDeps() {
  let esbuild, playwright;
  try { esbuild = require('esbuild'); } catch { die(`dependencies missing. Run:  npm ci --prefix "${HERE}"`); }
  try { playwright = require('playwright'); } catch {
    die(`playwright missing. Run:  npm i --prefix "${HERE}" playwright && npx --prefix "${HERE}" playwright install chromium`);
  }
  return { esbuild, playwright };
}

function ff(args, { quiet = true } = {}) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', quiet ? 'error' : 'info', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
  if (r.error) die('ffmpeg not found on PATH');
  if (r.status !== 0) die('ffmpeg failed');
}

async function bundleScene(esbuild, scenePath, outDir) {
  const res = await esbuild.build({
    stdin: {
      contents: `import * as mod from ${JSON.stringify(scenePath)}; window.__scene = mod;`,
      resolveDir: path.dirname(scenePath), loader: 'js',
    },
    bundle: true, format: 'iife', outfile: path.join(outDir, 'bundle.js'),
    nodePaths: [path.join(HERE, 'node_modules')],
    alias: { 'motion-kit': path.join(HERE, 'kit.js') },
    jsx: 'automatic', target: 'chrome120', logLevel: 'warning',
    ignoreAnnotations: true, // d3 is marked side-effect-free, which would tree-shake away selection.transition()
    define: { 'process.env.NODE_ENV': '"production"', global: 'window' },
    loader: { '.png': 'dataurl', '.jpg': 'dataurl', '.jpeg': 'dataurl', '.webp': 'dataurl', '.svg': 'dataurl',
      '.woff2': 'dataurl', '.woff': 'dataurl', '.ttf': 'dataurl', '.glsl': 'text', '.frag': 'text', '.vert': 'text', '.csv': 'text', '.txt': 'text' },
  });
  if (res.errors.length) die('bundle failed');
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2',
  '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.csv': 'text/csv', '.glb': 'model/gltf-binary' };

// Serves the bundle at /__motion/ and the scene's own folder at / (so fetch('./data.json') works).
function serve(sceneDir, tmpDir) {
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (u === '/__motion/index.html') {
      res.writeHead(200, { 'content-type': 'text/html' });
      return res.end(`<!doctype html><html><head><meta charset="utf-8"><style>
        html,body{margin:0;padding:0;overflow:hidden;background:transparent}
        #root{position:relative;overflow:hidden}
        *{box-sizing:border-box} body{-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
      </style></head><body><div id="root"></div><script src="/__motion/bundle.js"></script></body></html>`);
    }
    const base = u.startsWith('/__motion/') ? tmpDir : sceneDir;
    const file = path.join(base, u.replace(/^\/__motion\//, '/'));
    if (!file.startsWith(base) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r({ server, url: `http://127.0.0.1:${server.address().port}/__motion/index.html` })));
}

const warned = new Set();
// Renders are hermetic by default: anything not served locally is refused immediately, so a scene can
// never hang on (or silently depend on) a CDN. Pass --allow-network to opt out.
const offline = (page, opts) => opts.network ? null
  : page.route((u) => !/^(127\.0\.0\.1|localhost)$/.test(u.hostname) && /^https?:$/.test(u.protocol), (r) => r.abort());
const CHROME_ARGS = ['--disable-accelerated-2d-canvas', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl',
  '--disable-lcd-text', '--font-render-hinting=none', '--autoplay-policy=no-user-gesture-required', '--force-color-profile=srgb'];

// Per-frame loudness envelope so visuals can react to the soundtrack deterministically.
function analyseAudio(wavPath, fps, frames) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', wavPath, '-ac', '1', '-ar', '24000', '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  if (r.status !== 0) return null;
  const pcm = new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.byteLength >> 2);
  const hop = 24000 / fps, level = [], bass = [];
  const a = 1 - Math.exp((-2 * Math.PI * 140) / 24000);
  let lp = 0, k = 0;
  for (let f = 0; f < frames; f++) {
    let s = 0, sb = 0, n = 0;
    for (const end = Math.min(pcm.length, Math.round((f + 1) * hop)); k < end; k++, n++) {
      const v = pcm[k]; lp += a * (v - lp); s += v * v; sb += lp * lp;
    }
    level.push(n ? Math.sqrt(s / n) : 0); bass.push(n ? Math.sqrt(sb / n) : 0);
  }
  const norm = (arr) => { const m = Math.max(1e-6, ...arr); return arr.map((v) => +(v / m).toFixed(4)); };
  return { level: norm(level), bass: norm(bass) };
}

async function renderAudio(playwright, url, ctx, outWav, network) {
  const browser = await playwright.chromium.launch({ args: CHROME_ARGS });
  try {
    const page = await browser.newPage();
    await offline(page, { network });
    page.on('pageerror', (e) => console.error('[audio page error]', e.message));
    await page.goto(url);
    const b64 = await page.evaluate(async (ctx) => {
      let buf = await window.__scene.audio(ctx);
      if (buf && typeof buf.get === 'function') buf = buf.get(); // Tone.ToneAudioBuffer -> AudioBuffer
      const ch = Math.min(2, buf.numberOfChannels), n = buf.length, sr = buf.sampleRate;
      const data = new DataView(new ArrayBuffer(44 + n * ch * 2));
      const w = (o, s) => [...s].forEach((c, i) => data.setUint8(o + i, c.charCodeAt(0)));
      w(0, 'RIFF'); data.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVEfmt '); data.setUint32(16, 16, true);
      data.setUint16(20, 1, true); data.setUint16(22, ch, true); data.setUint32(24, sr, true);
      data.setUint32(28, sr * ch * 2, true); data.setUint16(32, ch * 2, true); data.setUint16(34, 16, true);
      w(36, 'data'); data.setUint32(40, n * ch * 2, true);
      const chans = Array.from({ length: ch }, (_, c) => buf.getChannelData(c));
      let o = 44;
      for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) {
        const v = Math.max(-1, Math.min(1, chans[c][i])); data.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true); o += 2;
      }
      const bytes = new Uint8Array(data.buffer); let s = '';
      for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      return btoa(s);
    }, ctx);
    fs.writeFileSync(outWav, Buffer.from(b64, 'base64'));
  } finally { await browser.close(); }
}

async function captureWorker({ playwright, url, ctx, frameList, lastFrame, tmp, opts, onProgress }) {
  const browser = await playwright.chromium.launch({ args: CHROME_ARGS });
  try {
    const context = await browser.newContext({ viewport: { width: ctx.width, height: ctx.height }, deviceScaleFactor: opts.scale });
    const page = await context.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
    if (opts.verbose) page.on('console', (m) => console.error(`  [page] ${m.text()}`));
    page.on('response', (r) => { // missing assets are a warning, not fatal (p5 probes for translation files, for example)
      const k = `${r.status()} ${r.url().replace(/^https?:\/\/127\.0\.0\.1:\d+/, '')}`;
      if (r.status() >= 400 && !/favicon|\/__motion\/[a-z-]+\.json$/i.test(k) && !warned.has(k)) { warned.add(k); console.error(`  warning: HTTP ${k}`); }
    });
    await offline(page, opts);
    await page.addInitScript(`window.__motionSeed=${opts.seed};`);
    await page.addInitScript({ path: path.join(HERE, 'time-shim.js') });
    await page.goto(url);
    const cdp = await context.newCDPSession(page);
    if (opts.transparent) await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
    await page.evaluate(async (ctx) => {
      const root = document.getElementById('root');
      root.style.width = ctx.width + 'px'; root.style.height = ctx.height + 'px';
      if (!ctx.transparent) root.style.background = ctx.background;
      if (!window.__scene || typeof window.__scene.default !== 'function') throw new Error('scene must `export default function scene(ctx)`');
      const api = await window.__scene.default({ ...ctx, root });
      const hook = typeof api === 'function' ? api : api && (api.onFrame || api.frame);
      if (hook) window.__motion.onFrame((t) => hook(t, Math.round(t * ctx.fps)));
      await document.fonts.ready;
      window.__motion.start();
    }, ctx);
    const want = new Set(frameList);
    const ext = opts.lossless || opts.transparent ? 'png' : 'jpeg';
    for (let i = 0; i <= lastFrame; i++) {
      if (opts.seekable && !want.has(i)) continue; // stateless scene: jump straight to the frames we need
      await page.evaluate((t) => window.__motion.frame(t), (i * 1000) / ctx.fps);
      if (want.has(i)) {
        const shot = await cdp.send('Page.captureScreenshot', ext === 'png' ? { format: 'png' } : { format: 'jpeg', quality: 95 });
        fs.writeFileSync(path.join(tmp, `f_${String(i).padStart(6, '0')}.${ext === 'png' ? 'png' : 'jpg'}`), Buffer.from(shot.data, 'base64'));
        onProgress();
      }
      if (errs.length) throw new Error('scene error: ' + errs[0]);
    }
  } finally { await browser.close(); }
}

async function prepare(args) {
  const scenePath = path.resolve(args._[1] || die('scene file required'));
  if (!fs.existsSync(scenePath)) die(`no such scene: ${scenePath}`);
  const { esbuild, playwright } = loadDeps();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'motion-'));
  await bundleScene(esbuild, scenePath, tmp);
  const { server, url } = await serve(path.dirname(scenePath), tmp);

  // Read the scene's own config, then let the CLI override it.
  const probe = await playwright.chromium.launch({ args: CHROME_ARGS });
  const pp = await probe.newPage();
  await offline(pp, { network: !!args['allow-network'] });
  const pageErrs = [];
  pp.on('pageerror', (e) => pageErrs.push(e.message));
  await pp.goto(url);
  const info = await pp.evaluate(() => ({ config: window.__scene?.config || {}, hasAudio: typeof window.__scene?.audio === 'function' }));
  await probe.close();
  if (pageErrs.length) die('scene failed to load: ' + pageErrs[0]);

  const cfg = { width: 1920, height: 1080, fps: 30, duration: 5, background: '#000', ...info.config };
  if (args.preset) { const p = PRESETS[args.preset] || die(`unknown preset ${args.preset}`); [cfg.width, cfg.height] = p; }
  if (args.size) [cfg.width, cfg.height] = String(args.size).split('x').map(Number);
  if (args.fps) cfg.fps = +args.fps;
  if (args.duration) cfg.duration = +args.duration;
  if (args.background) cfg.background = args.background;
  const opts = {
    scale: +(args.scale || 1), seed: +(args.seed || cfg.seed || 1), transparent: !!args.transparent,
    lossless: !!args.lossless, crf: +(args.crf || cfg.crf || 18), seekable: !!cfg.seekable, verbose: !!args.verbose, network: !!args['allow-network'],
  };
  const ctx = { width: cfg.width, height: cfg.height, fps: cfg.fps, duration: cfg.duration, background: cfg.background,
    transparent: opts.transparent, params: { ...(cfg.params || {}), ...args.set }, audio: null };
  return { scenePath, playwright, tmp, server, url, cfg, opts, ctx, hasAudio: info.hasAudio };
}

async function capture(job, frameList) {
  const { playwright, url, ctx, tmp, opts } = job;
  const nWorkers = Math.max(1, Math.min(+(job.workers || 0) || Math.min(4, os.cpus().length), frameList.length));
  let done = 0; const t0 = Date.now();
  const onProgress = () => {
    done++;
    if (process.stderr.isTTY || done % 30 === 0 || done === frameList.length)
      process.stderr.write(`\r  frames ${done}/${frameList.length}  (${((Date.now() - t0) / 1000).toFixed(1)}s)${process.stderr.isTTY ? '' : '\n'}`);
  };
  await Promise.all(Array.from({ length: nWorkers }, (_, w) => {
    const mine = frameList.filter((_, k) => k % nWorkers === w);
    return captureWorker({ playwright, url, ctx, frameList: mine, lastFrame: mine[mine.length - 1], tmp, opts, onProgress });
  }));
  if (process.stderr.isTTY) process.stderr.write('\n');
}

const COLOR = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv'];
const TO709 = 'scale=in_range=full:out_range=tv:out_color_matrix=bt709:flags=lanczos';

async function cmdRender(args) {
  const out = path.resolve(args.o || die('-o <output> required'));
  const job = await prepare(args);
  job.workers = args.workers || job.cfg.workers;
  const { cfg, ctx, opts, tmp } = job;
  try {
    const total = Math.round(cfg.duration * cfg.fps);
    const first = Math.max(0, Math.round(+(args.from || 0) * cfg.fps));
    const last = Math.min(total, args.to ? Math.round(+args.to * cfg.fps) : total) - 1;
    console.error(`motion: ${path.basename(job.scenePath)}  ${cfg.width}x${cfg.height}@${cfg.fps}  ${cfg.duration}s  scale ${opts.scale}`);

    let wav = null;
    if (args.audio && args.audio !== true) wav = path.resolve(args.audio);
    else if (job.hasAudio && args.audio !== false) {
      wav = path.join(tmp, 'audio.wav');
      await renderAudio(job.playwright, job.url, { ...ctx }, wav, opts.network);
      console.error('  audio rendered');
    }
    if (path.extname(out).toLowerCase() === '.wav') { // audio only
      if (!wav) die('scene has no `audio` export');
      fs.mkdirSync(path.dirname(out), { recursive: true }); fs.copyFileSync(wav, out);
      console.error(`motion: wrote ${out}`); return;
    }
    if (wav) ctx.audio = analyseAudio(wav, cfg.fps, total);

    const frames = []; for (let i = first; i <= last; i++) frames.push(i);
    await capture(job, frames);

    const ext = path.extname(out).toLowerCase();
    const fext = opts.lossless || opts.transparent ? 'png' : 'jpg';
    const input = ['-framerate', String(cfg.fps), '-start_number', String(first), '-i', path.join(tmp, `f_%06d.${fext}`)];
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const aIn = wav ? ['-ss', String(first / cfg.fps), '-i', wav] : [];
    if (!ext) { // PNG / JPG sequence
      fs.mkdirSync(out, { recursive: true });
      for (const f of fs.readdirSync(tmp).filter((f) => f.startsWith('f_'))) fs.copyFileSync(path.join(tmp, f), path.join(out, f));
      if (wav) fs.copyFileSync(wav, path.join(out, 'audio.wav'));
    } else if (ext === '.gif') {
      const w = +(args['gif-width'] || Math.min(cfg.width, 720));
      ff([...input, '-vf', `fps=${Math.min(cfg.fps, 25)},scale=${w}:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`, out]);
    } else if (ext === '.mov') {
      ff([...input, ...aIn, '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', opts.transparent ? 'yuva444p10le' : 'yuv444p10le',
        ...(wav ? ['-c:a', 'pcm_s16le', '-shortest'] : []), out]);
    } else if (ext === '.webm') {
      ff([...input, ...aIn, '-c:v', 'libvpx-vp9', '-pix_fmt', opts.transparent ? 'yuva420p' : 'yuv420p', '-crf', String(opts.crf + 8), '-b:v', '0',
        '-row-mt', '1', ...(wav ? ['-c:a', 'libopus', '-b:a', '160k', '-shortest'] : []), out]);
    } else {
      ff([...input, ...aIn, '-vf', `${TO709},format=yuv420p`, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(opts.crf), ...COLOR,
        '-movflags', '+faststart', ...(wav ? ['-c:a', 'aac', '-b:a', '192k', '-shortest'] : []), out]);
    }
    if (wav && args['keep-audio']) fs.copyFileSync(wav, out.replace(/\.[^.]+$/, '') + '.wav');
    const size = ext ? `${(fs.statSync(out).size / 1e6).toFixed(2)} MB` : 'sequence';
    console.error(`motion: wrote ${out}  (${size})`);
  } finally { job.server.close(); fs.rmSync(tmp, { recursive: true, force: true }); }
}

async function cmdSheet(args) {
  const out = path.resolve(args.o || die('-o <sheet.png> required'));
  const job = await prepare(args);
  job.workers = args.workers || job.cfg.workers;
  const { cfg, tmp } = job;
  try {
    const total = Math.round(cfg.duration * cfg.fps);
    let times;
    if (args.at) times = String(args.at).split(',').map(Number);
    else { const n = +(args.count || 8); times = Array.from({ length: n }, (_, i) => ((i + 0.5) / n) * cfg.duration); }
    const frames = [...new Set(times.map((t) => Math.min(total - 1, Math.max(0, Math.round(t * cfg.fps)))))].sort((a, b) => a - b);
    await capture(job, frames);
    const cols = +(args.cols || Math.min(4, frames.length)), rows = Math.ceil(frames.length / cols);
    const cellW = +(args['cell-width'] || 640);
    const list = path.join(tmp, 'list.txt');
    const fext = job.opts.lossless || job.opts.transparent ? 'png' : 'jpg';
    fs.writeFileSync(list, frames.map((f) => `file '${path.join(tmp, `f_${String(f).padStart(6, '0')}.${fext}`)}'\nduration 1`).join('\n'));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    ff(['-f', 'concat', '-safe', '0', '-i', list, '-vf', `scale=${cellW}:-2,tile=${cols}x${rows}:padding=6:margin=6:color=0x202020`, '-frames:v', '1', '-update', '1', out]);
    console.error(`motion: wrote ${out}  frames at ${frames.map((f) => (f / cfg.fps).toFixed(2) + 's').join(', ')}`);
  } finally { job.server.close(); fs.rmSync(tmp, { recursive: true, force: true }); }
}

function probe(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height,r_frame_rate', '-of', 'json', file], { encoding: 'utf8' });
  if (r.status !== 0) die(`cannot probe ${file}`);
  const j = JSON.parse(r.stdout); const v = j.streams.find((s) => s.codec_type === 'video');
  const [n, d] = v.r_frame_rate.split('/').map(Number);
  return { duration: +j.format.duration, width: v.width, height: v.height, fps: n / d, hasAudio: j.streams.some((s) => s.codec_type === 'audio') };
}

function cmdConcat(args) {
  const files = args._.slice(1).map((f) => path.resolve(f));
  const out = path.resolve(args.o || die('-o required'));
  if (files.length < 2) die('need at least two clips');
  const x = +(args.xfade ?? 0.4), transition = args.transition || 'fade';
  const info = files.map(probe);
  const { width, height, fps } = info[0];
  const inputs = files.flatMap((f) => ['-i', f]);
  const ext = args.audio && args.audio !== true ? path.resolve(args.audio) : null;
  const keepClipAudio = !ext && info.every((i) => i.hasAudio);
  let fc = files.map((_, i) => `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,fps=${fps},format=yuv420p,setsar=1[v${i}]`).join(';');
  let vLast = 'v0', aLast = '0:a', offset = 0;
  for (let i = 1; i < files.length; i++) {
    offset += info[i - 1].duration - x;
    if (x > 0) fc += `;[${vLast}][v${i}]xfade=transition=${transition}:duration=${x}:offset=${offset.toFixed(3)}[x${i}]`;
    else fc += `;[${vLast}][v${i}]concat=n=2:v=1:a=0[x${i}]`;
    vLast = `x${i}`;
    if (keepClipAudio) {
      fc += x > 0 ? `;[${aLast}][${i}:a]acrossfade=d=${x}[a${i}]` : `;[${aLast}][${i}:a]concat=n=2:v=0:a=1[a${i}]`;
      aLast = `a${i}`;
    }
  }
  const total = info.reduce((s, i) => s + i.duration, 0) - x * (files.length - 1);
  const maps = ['-map', `[${vLast}]`];
  if (ext) { inputs.push('-i', ext); fc += `;[${files.length}:a]afade=t=out:st=${Math.max(0, total - 0.8).toFixed(2)}:d=0.8[aout]`; maps.push('-map', '[aout]'); }
  else if (keepClipAudio) maps.push('-map', `[${aLast}]`);
  ff([...inputs, '-filter_complex', fc, ...maps, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(args.crf || 16), ...COLOR,
    '-movflags', '+faststart', ...(maps.length > 2 ? ['-c:a', 'aac', '-b:a', '192k'] : []), '-t', total.toFixed(3), out]);
  console.error(`motion: wrote ${out}  (${total.toFixed(2)}s, ${(fs.statSync(out).size / 1e6).toFixed(2)} MB)`);
}

async function cmdDoctor() {
  const ok = (b, m) => console.log(`${b ? 'ok  ' : 'FAIL'} ${m}`);
  let good = true;
  ok(+process.versions.node.split('.')[0] >= 20, `node ${process.versions.node}`);
  for (const m of ['esbuild', 'animejs', 'pixi.js', 'p5', 'matter-js', 'd3', 'tone', 'react', '@react-spring/web', 'three']) {
    let has = fs.existsSync(path.join(HERE, 'node_modules', m)); good &&= has; ok(has, `${m}${has ? '' : `   -> npm ci --prefix "${HERE}"`}`);
  }
  let pw = null; try { pw = require('playwright'); } catch {}
  ok(!!pw, `playwright${pw ? '' : `   -> npm i --prefix "${HERE}" playwright && npx playwright install chromium`}`); good &&= !!pw;
  if (pw) { try { const b = await pw.chromium.launch({ args: CHROME_ARGS }); ok(true, `chromium ${b.version()}`); await b.close(); } catch (e) { ok(false, 'chromium launch: ' + e.message.split('\n')[0]); good = false; } }
  for (const b of ['ffmpeg', 'ffprobe']) { const r = spawnSync(b, ['-version']); ok(r.status === 0, b); good &&= r.status === 0; }
  process.exit(good ? 0 : 1);
}

const args = parseArgs(process.argv.slice(2));
const cmd = args._[0];
if (!cmd || args.help) { console.log(HELP); process.exit(0); }
({ render: cmdRender, sheet: cmdSheet, concat: cmdConcat, doctor: cmdDoctor }[cmd] || (() => die(`unknown command ${cmd}\n${HELP}`)))(args);
