# Cursor Lab

A single-screen workbench for custom web cursors. **27 cursors** — 11 drawn and 16
animated — each one live, each parameter tunable, and the JS / React / CSS snippet is
generated from the values you actually tuned.

No build step, no dependencies, no framework. Open `index.html` and it runs.

**[Live demo →](https://cursorlab.dev)** · MIT licensed

---

## What it is

Most cursor collections hand you a static snippet and hope it fits. This one hands you a
control panel: drag a slider, watch the cursor change under your pointer, then copy code
that already carries your values.

```
┌──────────────────────────────────────────────────────────────┐
│ ▚ CURSOR LAB       [ DESIGN │ ANIMATED ]     16 UNITS   ⭐ ─  │
├────────────┬───────────────────────────────┬─────────────────┤
│ POINTER    │                               │ POINTER / 01    │
│ Dot & Ring │          LIVE STAGE           │ DOT & RING      │
│ ...        │                               │ ─────────────── │
│ TRAIL      │                               │ FOLLOW    0.14  │
│ ...        │                               │ ▮▮▮▮▮▮▯▯▯▯▯▯▯▯  │
│ FIELD      │                               │ [RESET][SOURCE] │
└────────────┴───────────────────────────────┴─────────────────┘
             └── SOURCE slides up over the stage ──┘
```

## Catalogue

**Design** — drawn cursors, shipped as `cursor: url(data:image/svg+xml,…)`.

| Group | Cursors |
|---|---|
| Aero | Aero Arrow |
| Y2K | Candy Arrow · Bunny · Sparkle · Cherry · Love Arrow |
| 8-bit | Pixel Arrow · Pixel Heart · Pixel Pencil |
| Kawaii | Kitty · Peepers |

**Animated** — grouped by what they actually do.

| Group | Cursors |
|---|---|
| Pointer *(replace the arrow)* | Dot & Ring · Velocity Squish · Crosshair HUD · Custom Pointer · Figma Cursor · Eyes · Liquid Glass · Butterfly |
| Trail *(leave something behind)* | Cascading Dots · Swirl · Silky Ribbon · Pixel Trail · Fluid Smoke · Cursor Ghost |
| Field *(the surface reacts)* | Magnet Lines · Dot Grid Warp |

## Features

- **Live parameters.** Sliders, toggles, segmented controls, colour swatches and text
  fields. Changes apply on the running effect without a remount.
- **Code follows the knobs.** Tune, then copy — the snippet carries your values, not the
  defaults. Three stacks per entry.
- **Gradients everywhere.** Each effect samples the paint along its own natural `0…1`
  (tail position, particle life, field strength), which is cheaper and reads better than
  a real canvas gradient.
- **Single screen.** The page never scrolls; the catalogue, inspector and source drawer
  scroll inside themselves.
- **Honest degradation.** Every generated snippet checks `(pointer: fine)` and does
  nothing on touch.

## Quick start

```bash
git clone https://github.com/oleksand4rux-del/cursor-lab.git
cd cursor-lab
python -m http.server 5175
```

Then open `http://localhost:5175`. Opening `index.html` straight from disk works too.

## Using a cursor

Open any entry, tune it, hit **SOURCE**, pick a stack and copy. Three rules the generated
code always follows:

1. **Hide the native pointer narrowly** — `cursor: none` on a section, never the document.
2. **Never animate layout** — only `transform` and `opacity`, one write per frame inside
   a single `requestAnimationFrame`.
3. **Degrade honestly** — gate on `(pointer: fine)` and simply do nothing on touch.

## Adding a cursor

Every entry is one object. Push it into the right file and the catalogue, groups,
counters, inspector and code panel pick it up automatically.

```js
ANIM_DB.push({
  id: 'my-cursor',
  name: 'My Cursor',
  group: 'Pointer',              // Pointer | Trail | Field
  desc: 'One sentence on what it does and why.',
  hideCursor: true,
  content: '<div class="stage__body">…</div>',

  params: [
    { key: 'ease',  label: 'Follow', type: 'range',  min: .04, max: .4, step: .01, value: .14 },
    { key: 'count', label: 'Nodes',  type: 'range',  min: 3, max: 40, step: 1, value: 14, rebuild: true },
    { key: 'on',    label: 'Blend',  type: 'switch', value: true },
    { key: 'mode',  label: 'Mode',   type: 'select', value: 'a', options: ['a', 'b'] },
    { key: 'label', label: 'Name',   type: 'text',   value: 'you' },
    { key: 'color', label: 'Colour', type: 'paint',  value: { a: '#FFFFFF', b: '#5B9BF6', on: false } }
  ],

  mount(stage, p) { /* p mutates live */ return destroy; },
  code(p) { return { js, react, css }; }
});
```

`rebuild: true` marks a parameter that needs the effect recreated (element counts, for
example). Everything else applies without a remount.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full walkthrough.

## Project layout

```
index.html             the single screen
assets/style.css       design tokens, three panes, source drawer
assets/engine.js       tiny runtime: FX.mount / layer / canvas / paint helpers
assets/db-design.js    11 drawn cursors
assets/db-pointer.js   8 pointer effects
assets/db-trail.js     6 trail effects
assets/db-field.js     2 field effects
assets/app.js          catalogue, inspector, code generation, clipboard
docs/NOTES.uk.md       detailed build notes (Ukrainian)
```

## Design

Built in the **Nothing** design language: monochrome, typography carries the hierarchy,
structure instead of ornament. Dark, OLED black. One accent per screen — a single red
bar on the active catalogue row.

Type: [Doto](https://fonts.google.com/specimen/Doto) for display,
[Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) for UI,
[Space Mono](https://fonts.google.com/specimen/Space+Mono) for data and labels.

## Credits

Researched from [Awwwards](https://www.awwwards.com/awwwards/collections/hovers-cursors-and-cute-interactions/),
[Codrops](https://tympanus.net/codrops/tag/cursor/), [React Bits](https://reactbits.dev/),
[Motion](https://motion.dev/docs/cursor) and the Framer Marketplace. Every effect here is
an original implementation.

Built by **[Oleksandr Yeromin](https://www.linkedin.com/in/oleksand4r/)**.

## Licence

[MIT](LICENSE)
