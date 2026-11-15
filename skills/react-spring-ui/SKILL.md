---
name: react-spring-ui
description: Animate a product UI being used — cards, lists, toggles, modals, expanding panels, notifications — with spring physics via react-spring, for product demos, feature walkthroughs and "see it in action" clips. Use when the shot shows interface components reacting to scripted interactions, when the user's product is a React app, or when motion should feel physical rather than timed.
---

# react-spring UI walkthroughs

Template: `${CLAUDE_PLUGIN_ROOT}/demos/02-react-spring-ui/scene.jsx`. Name the file `.jsx`; React 19 and `@react-spring/web` are bundled by the toolkit.

The pattern is a **scripted state machine**: a `step` counter advances on virtual-clock timers, and every visual is a spring that targets a value derived from `step`. You describe *what state the UI is in*; springs produce the motion.

```jsx
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { animated, useSpring, useTrail, config as presets } from '@react-spring/web';

function App({ u }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const ts = [300, 1900, 3000, 4300].map((ms, i) => setTimeout(() => setStep(i + 1), ms));
    return () => ts.forEach(clearTimeout);
  }, []);
  const trail  = useTrail(3, { opacity: step >= 1 ? 1 : 0, x: step >= 1 ? 0 : u(40), config: { tension: 210, friction: 18 } });
  const toggle = useSpring({ on: step >= 2 ? 1 : 0, config: presets.wobbly });
  return trail.map((st, i) => <animated.div key={i} style={st}>…</animated.div>);
}
export default function scene({ root, width, height }) {
  createRoot(root).render(<App u={unit(width, height)} />);
}
```

## What matters

- **Timers must be > 50 ms** (shorter ones run in real time during setup). Schedule the first step at ≥ 100 ms.
- **Not seekable.** Springs integrate frame to frame — never set `seekable: true`.
- **Spring feel**: `{ tension, friction, mass }`. Snappy UI 210/20. Soft settle 170/26 (`presets.default`). Bouncy toggle 180/12 (`presets.wobbly`). Hard pop for likes/badges 380/9, mass 0.8. Slow progress fill 40/16. Lower friction = more overshoot; overshoot on layout size (height) reads as jelly, so keep friction ≥ 14 there.
- **Interpolate, don't re-render**: `spring.to(v => …)` for colours, widths, shadows. Clamp overshoot where a value must stay in range (`Math.max(0, Math.min(1, v))` for opacity/colour mixes).
- **Give springs time to settle** — about 1 s between steps; a step every 400 ms looks frantic.
- **Scale for video**: a UI that looks right at web sizes is far too small on screen. Multiply your unit by ~1.3 and let the UI panel fill 40–50% of the frame. Show 3–4 components, not a whole app.
- **Real components**: you can import the user's own React components if they have no network/data dependencies; stub data as props. Inline styles or a `<style>` tag — no CSS-modules pipeline.
- **A cursor** makes interactions legible: an absolutely positioned dot whose x/y springs to each target ~250 ms before the step that "clicks", with a quick scale 1→0.85→1.
