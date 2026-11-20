# Contributing

Thanks for taking a look. The site is React with Vite, but a cursor is not: every effect is
one plain JavaScript object, so adding one never touches the React side.

```bash
npm install
npm run dev
```

Before a pull request, `npm run typecheck` and `npm run build` should both pass.

## Adding a cursor

Pick the file that matches what your cursor does:

| File | For |
|---|---|
| `src/cursors/db-pointer.js` | it replaces the arrow with a single object |
| `src/cursors/db-trail.js` | it leaves something behind |
| `src/cursors/db-field.js` | the surface reacts, the arrow stays |
| `src/cursors/db-design.js` | a drawn `cursor: url(...)` with no JS |

Push one object into the array. Everything else, the catalogue row, its group, the
DialKit panel and the code view, is derived.

### The contract

```js
{
  id, name, group, desc,
  hideCursor,        // false keeps the native arrow visible
  content,           // HTML for the demo stage
  params: [ … ],     // see below
  mount(stage, p),   // returns a destroy function
  code(p)            // returns { js, react, css }
}
```

`mount` receives the live parameter object. Read from it inside your loop rather than
capturing values, so a slider drag lands immediately.

`code(p)` must return the same values the user is looking at. If a parameter does not
show up in the generated snippet, it is a bug.

### Parameter types

Each type becomes a DialKit control. The `label` is what the panel shows, so write it in
sentence case and keep dots out of it (DialKit uses them as path separators).

| `type` | In the panel | Value |
|---|---|---|
| `range` | slider; `px`, `s`, `ms`, `deg` and `%` units go into the label | number |
| `switch` | Off / On | boolean |
| `select` | select | string from `options` |
| `text` | text field | string |
| `paint` | Fill, Gradient, and End while the gradient is on, in the Colours folder | `{ a, b, on, angle }` |

Add `rebuild: true` when a change requires recreating elements (a node count, for
example). Everything else applies without a remount.

Add `group: 'NAME'` to fold a parameter into a folder; it opens closed. Ungrouped
parameters keep their place in the list. Reserve that for the one or two switches people
reach for most.

### Paint

Never hardcode a colour. Use the helpers so gradients, Shuffle and Randomize work for free:

```js
FX.pc(p.color, t, alpha)   // rgba() sampled at position t (0…1)
FX.pat(p.color, t)         // hex at position t
FX.pcss(p.color)           // CSS background, a real gradient when enabled
FX.tintjs(p.color)         // JS source for a tint(t, a) helper, for snippets
```

`t` should be the effect's own natural 0…1: position along the tail, particle life, field
strength, node index. That is what makes a gradient read as part of the motion.

## House rules

1. **Hide the native pointer narrowly.** `cursor: none` on a section, never the document.
2. **Never animate layout.** Only `transform` and `opacity`, one write per frame.
3. **Degrade honestly.** Gate generated snippets on `(pointer: fine)`.
4. **Effects stay dependency free.** The code a visitor copies must run as pasted, so an
   effect never imports a package.

## Before opening a PR

- Every language tab produces code that runs as pasted.
- Switching away from your cursor leaves no elements or canvases behind.
- No console errors or warnings.
