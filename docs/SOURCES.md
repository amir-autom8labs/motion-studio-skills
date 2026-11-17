# What we took from outside sources

Two sources shaped version 0.3. Neither was run; both were read.

## Impeccable (pbakaus/impeccable)

A design-quality skill for web front ends with a list of visual tells of AI-made work. It named, among others, "Inter for everything", "purple-to-blue gradients" and gradient text — which described all twelve of our demos.

| Taken | Where |
|---|---|
| Name the tells and ban them explicitly | `art-direction` skill, "Tells to remove" |
| Decide the look before building | `motion-director` step 2 |
| The look as swappable tokens, not literals in scenes | `demos/_shared/looks.js`, seven looks, `--set look=` |

Not taken: its automatic detector and edit hook (web pages only), and its motion rules (durations under 800 ms and reduced-motion fallbacks are right for interfaces, wrong for film).

## "The Fable 5.2 Motion Playbook" (article)

A practitioner's write-up of making short looping films from one prompt.

| Lesson | What changed here |
|---|---|
| Stills lie: a model that checks stills will pass a frozen film | New `motion check`: freezes, motion per second, loop seam, loudness. On our own old reel it showed two static stretches (1.2 s and 2.8 s): both were holds rather than bugs, but one was almost twice as long as planned, and no contact sheet had shown that |
| Replace every adjective with a number | `motion-director` storyboard template and the "instead of / write" table |
| One number decides a landing: the spring damping ratio | `spring()` in motion-kit, closed-form; ratios 1.0 / 0.8 / 0.5 documented |
| Every motion a pure function of time, so any frame draws alone | Already the `seekable` contract; `motion check scene.js` now proves it by rendering frames cold and in sequence |
| Write the timing first; the score is the clock | "One clock" rule: cues in one module shared by picture and sound |
| Define "finished", report checks with numbers | `motion-director` "Done means" |
| Loudness −14 LUFS, true peak ≤ −2 dBTP, measured after encoding | Renderer normalises by default; `motion check` reports it. Our mix had been −16.6 LUFS with a −0.5 dB peak |
| Sound lands one frame after its picture | `tonejs-soundtrack` |
| Render on the GPU | `--gpu` flag (untested: no GPU on the build machine) |
| The reviewer should not be the builder | Noted in "Done means" |
| Name the defaults you hate in a bans line | `art-direction` and the storyboard template |

Not taken, and why:
- **Model effort levels, prices and usage limits.** The article quotes specific figures; none could be verified here, and they are advice about running the model, not about the plugin.
- **Motion blur by averaging sub-frames.** Worth having; not built. It multiplies render time by the sub-frame count, which is impractical without a GPU.
- **Measuring the subject's size in pixels automatically.** The rule is in the storyboard template; the measurement is still by eye on the contact sheet.
- **Remotion**: needs a paid licence for companies with more than three employees. **Blender MCP**: drives a live Blender window over an unauthenticated socket; our headless scripts are reproducible and safer.
