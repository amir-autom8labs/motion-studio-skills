// Virtual clock. Injected before any page script runs.
// Replaces performance.now / Date / requestAnimationFrame / timers / Math.random so that
// any animation library advances exactly one frame per captured frame, regardless of
// how long the frame takes to draw. Also scrubs CSS animations/transitions and WAAPI.
(() => {
  const SEED = window.__motionSeed ?? 1;
  const EPOCH = 1767225600000; // fixed wall clock: 2026-01-01T00:00:00Z
  const real = {
    setTimeout: window.setTimeout.bind(window),
    clearTimeout: window.clearTimeout.bind(window),
    setInterval: window.setInterval.bind(window),
    clearInterval: window.clearInterval.bind(window),
  };
  let now = 0;
  let running = false; // false during scene setup
  let nextId = 1e9;
  const timers = new Map();
  let rafs = new Map();
  const hooks = [];
  const errors = [];

  performance.now = () => now;
  const RealDate = Date;
  class VDate extends RealDate {
    constructor(...a) { if (a.length === 0) super(EPOCH + now); else super(...a); }
    static now() { return EPOCH + now; }
  }
  window.Date = VDate;

  // Seeded PRNG (mulberry32) so renders are reproducible and parallel workers agree.
  let s = SEED >>> 0;
  Math.random = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  window.requestAnimationFrame = (cb) => { const id = nextId++; rafs.set(id, cb); return id; };
  window.cancelAnimationFrame = (id) => { rafs.delete(id); };

  const addTimer = (fn, delay, args, interval) => {
    const id = nextId++;
    timers.set(id, { id, t: now + Math.max(0, +delay || 0), fn, args, interval });
    return id;
  };
  // During setup (before the first frame) short timers stay real so loaders and schedulers that
  // yield with setTimeout(0) keep working; anything longer is choreography and goes on the virtual clock.
  window.setTimeout = (fn, delay, ...args) =>
    running || (+delay || 0) > 50 ? addTimer(fn, delay, args, null) : real.setTimeout(fn, delay, ...args);
  window.setInterval = (fn, delay, ...args) => addTimer(fn, delay, args, Math.max(1, +delay || 0));
  window.clearTimeout = (id) => { if (!timers.delete(id)) real.clearTimeout(id); };
  window.clearInterval = (id) => { if (!timers.delete(id)) real.clearInterval(id); };

  const call = (fn, ...a) => {
    try { if (typeof fn === 'function') fn(...a); }
    catch (e) { errors.push(String(e && e.stack || e)); console.error(e); }
  };

  const births = new WeakMap();
  const syncCssAnimations = () => {
    if (!document.getAnimations) return;
    for (const a of document.getAnimations()) {
      if (!births.has(a)) { births.set(a, now); a.pause(); }
      try { a.currentTime = now - births.get(a); } catch {}
    }
  };

  const yieldTask = () => new Promise((r) => {
    const c = new MessageChannel();
    c.port1.onmessage = () => r();
    c.port2.postMessage(0);
  });

  window.__motion = {
    errors,
    onFrame(fn) { hooks.push(fn); },
    start() { running = true; },
    async frame(tMs) {
      let guard = 0;
      while (guard++ < 100000) {
        let due = null;
        for (const tm of timers.values()) if (tm.t <= tMs && (!due || tm.t < due.t || (tm.t === due.t && tm.id < due.id))) due = tm;
        if (!due) break;
        now = Math.max(now, due.t);
        if (due.interval) due.t += due.interval; else timers.delete(due.id);
        call(due.fn, ...due.args);
      }
      now = tMs;
      const cbs = [...rafs.values()];
      rafs = new Map();
      for (const cb of cbs) call(cb, now);
      for (const h of hooks) call(h, now / 1000);
      await yieldTask(); // let React / promise chains flush
      syncCssAnimations();
      await yieldTask();
    },
  };
})();
