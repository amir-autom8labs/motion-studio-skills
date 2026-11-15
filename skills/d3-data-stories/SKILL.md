---
name: d3-data-stories
description: Turn data into animated charts with D3 — line charts that draw on, bars that grow or race, counting headline numbers, annotated before/after comparisons, benchmark and growth visuals. Use when a launch or social clip needs to prove a claim with numbers (performance gains, adoption, pricing, survey results), or the user supplies a CSV/JSON to visualise in motion.
---

# D3 data stories

Template: `${CLAUDE_PLUGIN_ROOT}/demos/06-d3-data-story/scene.js` — line draws on, area reveals, points pop, headline counts to 87%, annotation lands. Works in landscape and portrait.

A motion chart makes **one point**. Decide the sentence first ("render time fell 87%"), then build only what supports it.

```js
import * as d3 from 'd3';

const path = svg.append('path').attr('d', line(DATA)).attr('fill', 'none').attr('stroke', 'url(#grad)');
const len = path.node().getTotalLength();
path.attr('stroke-dasharray', len).attr('stroke-dashoffset', len)
    .transition().delay(900).duration(2600).ease(d3.easeCubicInOut).attr('stroke-dashoffset', 0);

num.transition().delay(900).duration(2900).ease(d3.easeCubicInOut)
   .tween('text', () => { const i = d3.interpolateNumber(0, 87); return (k) => num.text(`${Math.round(i(k))}%`); });
```

Plain `d3.transition()` works: d3-timer runs on the renderer's virtual clock.

## What matters

- **Order of reveal** = order of the argument: title (what am I looking at) → axes/grid fade → data draws → headline number → annotation on the key point. 0.3–0.5 s between stages.
- **Sync the number to the mark**: the counter and the line share delay, duration and ease, so the number "is" the line.
- **Reveal an area with a clipPath** rect whose width transitions alongside the line's dash offset.
- **Stagger points** along the draw: `delay((d, i) => T0 + i / (n - 1) * DRAW)` with `easeBackOut.overshoot(3)`.
- **Strip the chart**: 4–6 gridlines at low contrast, no axis lines or ticks, labels ≥ 2.6% of the short side, every other x label in portrait. Direct-label instead of legends.
- **`font-variant-numeric: tabular-nums`** on counting numbers or the digits jitter.
- **Honest scales**: bars start at zero; say so if a line chart's axis doesn't. Round the counter to the precision of the claim.
- **Hold the final state ≥ 1.5 s** — this is the frame people screenshot.
- **Data in**: inline small arrays; `import raw from './data.csv'` (text) + `d3.csvParse(raw, d3.autoType)`, or `fetch('./data.json')` from the scene folder. Remote URLs are blocked.
- **Portrait**: branch on `height > width` to move the headline number below the title, increase the top margin, and reposition annotations (a steeper line collides with labels placed for landscape) — check the portrait sheet separately.
- **Bar chart race**: keyframe the ranks, `transition().duration(step).ease(d3.easeLinear)` on y and width, update values with a text tween; keep ≤ 10 bars.
