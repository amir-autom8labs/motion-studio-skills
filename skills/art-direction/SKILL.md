---
name: art-direction
description: Decide how a motion clip looks before building it — colour, typeface, treatment and the visual tells that make video look AI-generated. Use at the start of any video, animation or motion-graphics job, whenever the user supplies (or lacks) brand colours, fonts or a logo, when asked to restyle or re-skin a clip, to make clips look less generic or "less AI", to propose style directions or style frames, or to keep a multi-shot reel visually consistent.
---

# Art direction

A clip built without a decided look falls back to the same one every time: dark navy ground, violet-to-cyan gradient, Inter, glowing blobs, rounded dark cards. Viewers read that as machine-made within a second. Settle the look first, write it down as tokens, and build every shot from those tokens.

## 1. Get the brand, or propose one

Ask for: colours as hex, typeface (name or font files), logo as SVG, and one or two references they like. Use exactly what they give.

If they give nothing, do **not** pick silently. Propose two or three directions that differ in kind (light vs dark, serif vs grotesk, quiet vs loud), each as one line with numbers:

```
A  Editorial   paper #F4EFE6, ink #161412, accent #E0431E, Instrument Serif 400 / Hanken Grotesk
B  Poster      yellow #FFD400, black, accent #1F4BFF, Archivo Black, hard 1px outlines
C  Signal      black #050505, one lime #C6FF3D, Bricolage Grotesque 800, thin lines
```

Render one style frame of the hero shot per direction (`motion sheet scene.js --at 2.5 --set look=<name>`), show them, and let the user choose before building the rest. Changing the look after ten shots exist is the expensive way round.

## 2. Write the look as tokens

`${CLAUDE_PLUGIN_ROOT}/demos/_shared/looks.js` is the pattern: one object per look, and scenes read tokens instead of literals. Copy it into the project and replace a look with the brand.

```js
const brand = await useLook(sceneCtx, 'editorial');   // `--set look=bold` overrides; paints the stage, loads fonts
// surfaces: bg panel line text dim   accent: a (+ b c d supporting)   type: head hw ht hs (headline family, weight, tracking, size factor), font, mono
// fill: paint for the emphasised headline word   dark: additive glow allowed   particles, palette
```

Seven looks ship as starting points: `editorial`, `bold`, `paper`, `signal`, `ember`, `studio`, and `lumen` (the undirected default, kept as the example of what to avoid). Every demo takes `--set look=<name>`; the reel is built by rendering five scenes in one look.

Rules for a look:
- **One accent.** Supporting colours are neutrals or tints of it. Three equal accents is a tell.
- **Wide display faces need a size factor** (`hs`): the same headline in Archivo Black is about 30% wider than in Hanken Grotesk and will wrap or collide; check each shot in the chosen look.
- **Two typefaces at most**: a display face with character for headlines, a plain one for small text. Bundle the files — `npm i --prefix ${CLAUDE_PLUGIN_ROOT}/toolkit @fontsource/<name>`, import the `.woff2`, `await loadFonts([...])` — so renders don't depend on installed fonts. Check the font licence (the bundled ones are OFL).
- **Headline word emphasis is a flat colour**, not a gradient.
- **Light or dark changes the technique**, not just the palette: glow and additive particles need a dark ground; on a light ground draw them as ink with normal blending and more opacity (`brand.dark` switches this in the PixiJS and p5 demos).
- **Contrast for small screens**: body text against its ground at 4.5:1 or better; never grey text on a coloured fill. `ink(hex)` from motion-kit picks black or white for text on any fill.
- **One look per reel.** Shots in different looks do not cut together.

## 3. Tells to remove

Name these as bans in the brief; defaults leave only when named.

| Tell | Do instead |
|---|---|
| Inter / system font for everything | a display face chosen for the brand |
| Violet-to-blue or any two-colour gradient as the identity | one flat accent |
| Gradient-filled headline text | solid accent on one word |
| Dark navy ground with glowing blobs or orbs | flat ground; texture or a real light source if depth is needed |
| Blurred glass cards as decoration | solid panels with a hairline |
| Everything centred: pill, headline, subline, button | asymmetry; one element large, the rest small |
| Every element fades in and slides up the same distance | vary entrances by role: wipe, draw-on, scale, cut |
| Cards inside cards, every corner the same radius | one level of containment, radius chosen per element |
| Emoji or sparkles as icons | drawn marks in the brand's stroke weight |
| Confetti, lens flares, particles with no cause | effects only where the story has an impact |
| Zooms and whip pans for energy | cuts on the beat |
| Stock phrases ("supercharge", "ship faster", "the speed of thought") | the specific claim, with its number |

## 4. Check the look

- Render the contact sheet small (`--cell-width 320`): the headline and the subject must still read. That is phone size.
- Put the first frames of all shots side by side: same ground, same accent, same type.
- Smooth dark gradients band after video compression; prefer flat grounds, or keep gradients short and high-contrast.
