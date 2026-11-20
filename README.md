# Cursor Lab

A workbench for custom web cursors. **28 cursors**, 11 drawn and 17 animated, each one
live on the stage, each parameter tunable, and the JS, React or CSS snippet is generated
from the values you actually tuned.

**[Live site →](https://cursor-lab-ui.vercel.app)** · MIT licensed

---

## What it is

Most cursor collections hand you a static snippet and hope it fits. This one hands you a
control panel: pick a cursor, move over the stage, tune it in the floating panel, then
copy code that already carries your values.

```
┌───────────────┐                                        ┌──────────────────┐
│ Cursor Lab    │                                        │ Dot & Ring     × │
│ [Animated|De] │                                        │ Colours          │
│ ▾ Pointer     │              the stage                 │  Shuffle colours │
│   Dot & Ring  │       (the cursor runs here)           │  Randomize grad. │
│   Eyes …      │                                        │  Fill  Gradient  │
│ ▾ Trail       │                                        │ Follow      0.14 │
│ ▾ Field       │                                        │ Ring size     36 │
│ Made by …     │       ┌──────────────────────────┐     │ Reset            │
└───────────────┘       │ 412, 288 │ </> ⧉ │ ★ 35 │     └──────────────────┘
                        └──────────────────────────┘
   catalogue                   dock                       DialKit panel
```

## Catalogue

**Design**: drawn cursors, shipped as `cursor: url(data:image/svg+xml,…)`.

| Group | Cursors |
|---|---|
| Aero | Aero Arrow |
| Y2K | Candy Arrow · Bunny · Sparkle · Cherry · Love Arrow |
| 8-bit | Pixel Arrow · Pixel Heart · Pixel Pencil |
| Kawaii | Kitty · Peepers |

**Animated**: grouped by what they actually do.

| Group | Cursors |
|---|---|
| Pointer *(replace the arrow)* | Dot & Ring · Velocity Squish · Crosshair HUD · Custom Pointer · Figma Cursor · Eyes · Liquid Glass · Butterfly |
| Trail *(leave something behind)* | Cascading Dots · Swirl · Silky Ribbon · Pixel Trail · Fluid Smoke · Cursor Ghost |
| Field *(the surface reacts)* | Magnet Lines · ASCII Field · Dot Grid Warp |

## Features

- **[DialKit](https://www.dialkit.dev) panel.** Every cursor's parameters live in DialKit's
  own floating panel: drag it anywhere, fold it to an icon. Sliders take a drag, a click,
  arrow keys or a typed value. Groups open closed, so the panel stays short.
- **Colours.** Every panel opens with Shuffle colours and Randomize gradient, then the
  cursor's paints: a fill, a gradient switch, and the gradient's end colour while it is on.
- **Code follows the knobs.** The snippet carries your values, not the defaults. Three
  stacks per entry. Open it with **E**, copy with **C**.
- **Your tuning stays.** Leave a cursor and come back, and it still has your values.
- **Honest degradation.** Every generated snippet checks `(pointer: fine)` and does
  nothing on touch.

## Quick start

```bash
git clone https://github.com/oleksand4rux-del/cursor-lab.git
cd cursor-lab
npm install
npm run dev
```

Then open `http://localhost:5175`. `npm run build` writes the site to `dist/`.

## Using a cursor

Pick one, tune it, open the source, pick a stack and copy. Three rules the generated
code always follows:

1. **Hide the native pointer narrowly.** `cursor: none` on a section, never the document.
2. **Never animate layout.** Only `transform` and `opacity`, one write per frame inside
   a single `requestAnimationFrame`.
3. **Degrade honestly.** Gate on `(pointer: fine)` and do nothing on touch.

## Adding a cursor

Every entry is one plain JavaScript object, with no framework in it. Push it into the
right database and the catalogue, the DialKit panel and the code view pick it up.

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
src/cursors/engine.js      tiny runtime: FX.mount / layer / canvas / paint helpers
src/cursors/db-design.js   11 drawn cursors
src/cursors/db-pointer.js  8 pointer effects
src/cursors/db-trail.js    6 trail effects
src/cursors/db-field.js    3 field effects
src/lib/dial.ts            cursor params ↔ DialKit config, Shuffle and Randomize
src/lib/design.ts          drawn cursors: scale, tint, cursor value, generated code
src/components/            stage, catalogue, DialKit binding, source sheet
src/components/motion/     beUI components, installed with the shadcn CLI
src/App.tsx                the screen
src/index.css              theme tokens, DialKit theme, stage styles
public/                    logo, icons, link-preview card
docs/NOTES.uk.md           detailed build notes (Ukrainian)
```

## Design

React 19, Tailwind CSS 4 and Motion, with components from [beUI](https://beui.dev)
(file tree, tabs, dock, tooltip, bottom sheet) and parameters in
[DialKit](https://www.dialkit.dev).

A workbench at night: a dark cutting mat with a measuring grid, where each cursor is a
specimen you pick up and test. Graphite neutrals and one accent, the blue of DialKit's
switch, on the cursor in use, an On that is on, and the two colour actions. The live
cursor is the only thing on the screen that moves and carries colour. The dock reads out
where the pointer is on the mat, in stage pixels.

Type is [Geist](https://vercel.com/font) alone; monospace appears only inside code.

## Credits

Researched from [Awwwards](https://www.awwwards.com/awwwards/collections/hovers-cursors-and-cute-interactions/),
[Codrops](https://tympanus.net/codrops/tag/cursor/), [React Bits](https://reactbits.dev/),
[Motion](https://motion.dev/docs/cursor) and the Framer Marketplace. Every effect here is
an original implementation.

Parameters by [DialKit](https://www.dialkit.dev) from Josh Puckett, MIT. Components from
[beUI](https://beui.dev), MIT. Design pass with
[unslop](https://github.com/heydamir/unslop) by Damir Sokolovsky, CC BY 4.0.

Built by **[Oleksandr Yeromin](https://yrmn.me/)**.

## Licence

[MIT](LICENSE)
