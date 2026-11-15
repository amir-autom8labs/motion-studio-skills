// react-spring — a product UI walkthrough where every move is a spring. State changes are
// scripted with setTimeout (virtual clock), springs do the rest.
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { animated, useSpring, useTrail, config as presets } from '@react-spring/web';
import { unit } from 'motion-kit';
import { brand, gradient } from '../_shared/brand.js';

export const config = { width: 1920, height: 1080, fps: 30, duration: 7, background: brand.bg };

const ITEMS = [
  { icon: '◆', title: 'Timeline exported', sub: 'launch-teaser.mp4 · 4K · 12s', color: brand.a },
  { icon: '●', title: 'Review requested', sub: 'Maya left 3 comments', color: brand.c },
  { icon: '▲', title: 'Render farm ready', sub: '8 workers · 240 fps capacity', color: brand.b },
];

function App({ u, width, height }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const ts = [300, 1900, 3000, 4300, 5900].map((ms, i) => setTimeout(() => setStep(i + 1), ms));
    return () => ts.forEach(clearTimeout);
  }, []);

  const portrait = height > width;
  const head = useSpring({ opacity: step >= 1 ? 1 : 0, y: step >= 1 ? 0 : u(4), config: presets.slow });
  const trail = useTrail(ITEMS.length, {
    opacity: step >= 1 && step < 5 ? 1 : 0,
    x: step >= 1 ? (step < 5 ? 0 : u(30)) : u(40),
    scale: step >= 1 ? 1 : 0.8,
    config: { mass: 1, tension: 210, friction: 18 },
  });
  const toggle = useSpring({ on: step >= 2 ? 1 : 0, config: presets.wobbly });
  const expand = useSpring({ h: step >= 3 ? u(30) : u(11), glow: step >= 3 ? 1 : 0, config: { mass: 1.2, tension: 170, friction: 14 } });
  const bar = useSpring({ w: step >= 3 ? 100 : 0, config: { tension: 40, friction: 16 }, delay: 250 });
  const like = useSpring({ s: step >= 4 ? 1 : 0, config: { mass: 0.8, tension: 380, friction: 9 } });
  const panel = useSpring({ rot: step >= 5 ? -4 : 0, y: step >= 5 ? -u(4) : 0, opacity: step >= 5 ? 0 : 1, config: presets.gentle });

  const card = { borderRadius: u(2.4), background: brand.panel, border: `1px solid ${brand.line}`, padding: `${u(2.2)}px ${u(2.6)}px`, display: 'flex', alignItems: 'center', gap: u(2.2) };
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: portrait ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: u(7), fontFamily: brand.font, color: brand.text }}>
      <animated.div style={{ width: u(56), opacity: head.opacity, y: head.y }}>
        <div style={{ font: `600 ${u(2.1)}px ${brand.mono}`, letterSpacing: '.28em', color: brand.b }}>SPRING PHYSICS</div>
        <div style={{ fontSize: u(11), fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1.02, marginTop: u(2.5) }}>
          UI that<br /><span style={{ background: gradient, WebkitBackgroundClip: 'text', color: 'transparent' }}>feels real.</span>
        </div>
        <div style={{ fontSize: u(3.3), color: brand.dim, marginTop: u(3), lineHeight: 1.35 }}>No durations, no curves. Mass, tension and friction — every element settles the way objects do.</div>
      </animated.div>

      <animated.div style={{ width: u(60), display: 'flex', flexDirection: 'column', gap: u(2), opacity: panel.opacity, y: panel.y, rotate: panel.rot.to((r) => `${r}deg`) }}>
        {trail.map((st, i) => {
          const it = ITEMS[i];
          const isMain = i === 0;
          return (
            <animated.div key={i} style={{ ...card, ...st, flexDirection: 'column', alignItems: 'stretch', overflow: 'hidden',
              height: isMain ? expand.h : u(11),
              boxShadow: isMain ? expand.glow.to((g) => `0 ${u(2)}px ${u(8)}px rgba(124,92,255,${0.35 * g})`) : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: u(2.2), minHeight: u(6.4) }}>
                <div style={{ width: u(6.4), height: u(6.4), borderRadius: u(1.6), background: it.color, display: 'grid', placeItems: 'center', fontSize: u(2.6), color: brand.bg, flex: 'none' }}>{it.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: u(3), fontWeight: 650 }}>{it.title}</div>
                  <div style={{ fontSize: u(2.2), color: brand.dim, marginTop: u(0.5) }}>{it.sub}</div>
                </div>
                {i === 1 && (
                  <animated.div style={{ fontSize: u(4.4), color: brand.c, scale: like.s.to((s) => 0.6 + 0.6 * s), opacity: like.s.to((s) => 0.35 + 0.65 * Math.min(1, s)) }}>♥</animated.div>
                )}
                {i === 2 && (
                  <animated.div style={{ width: u(9), height: u(5), borderRadius: u(5), padding: u(0.5), flex: 'none',
                    background: toggle.on.to((v) => `rgba(34,211,238,${0.15 + 0.85 * Math.max(0, Math.min(1, v))})`) }}>
                    <animated.div style={{ width: u(4), height: u(4), borderRadius: '50%', background: '#fff', x: toggle.on.to((v) => v * u(4)) }} />
                  </animated.div>
                )}
              </div>
              {isMain && (
                <div style={{ marginTop: u(2.6) }}>
                  <div style={{ height: u(11), borderRadius: u(1.4), background: `linear-gradient(120deg, rgba(124,92,255,.35), rgba(34,211,238,.25))`, border: `1px solid ${brand.line}` }} />
                  <div style={{ height: u(0.9), borderRadius: 9, background: 'rgba(255,255,255,.08)', marginTop: u(2), overflow: 'hidden' }}>
                    <animated.div style={{ height: '100%', background: gradient, width: bar.w.to((w) => `${w}%`) }} />
                  </div>
                </div>
              )}
            </animated.div>
          );
        })}
      </animated.div>
    </div>
  );
}

export default function scene({ root, width, height }) {
  const base = unit(width, height), k = height > width ? 1.25 : 1.3; // video needs far bigger UI than a web page
  createRoot(root).render(<App u={(n) => base(n) * k} width={width} height={height} />);
}
