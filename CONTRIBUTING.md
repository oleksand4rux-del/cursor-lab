# Contributing

Thanks for taking a look. This is a static site — no build, no package manager, no
toolchain. Clone it, serve the folder, edit a file, reload.

```bash
python -m http.server 5175
```

## Adding a cursor

Pick the file that matches what your cursor does:

| File | For |
|---|---|
| `assets/db-pointer.js` | it replaces the arrow with a single object |
| `assets/db-trail.js` | it leaves something behind |
| `assets/db-field.js` | the surface reacts, the arrow stays |
| `assets/db-design.js` | a drawn `cursor: url(...)` with no JS |

Push one object into the array. Everything else — catalogue row, group header,
numbering, inspector controls, code panel — is derived.

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

| `type` | Renders as | Value |
|---|---|---|
| `range` | segmented bar, drag or arrow keys | number |
| `switch` | toggle | boolean |
| `select` | segmented control | string from `options` |
| `text` | underlined field | string |
| `paint` | swatches + two colour pickers + gradient toggle | `{ a, b, on, angle }` |

Add `rebuild: true` when a change requires recreating elements (a node count, for
example). Everything else applies without a remount.

Add `group: 'NAME'` to fold a parameter into a collapsible section. Ungrouped parameters
are pinned below the sections — reserve that for the one or two switches people reach for
most.

### Paint

Never hardcode a colour. Use the helpers so gradients work for free:

```js
FX.pc(p.color, t, alpha)   // rgba() sampled at position t (0…1)
FX.pat(p.color, t)         // hex at position t
FX.pcss(p.color)           // CSS background — a real gradient when enabled
FX.tintjs(p.color)         // JS source for a tint(t, a) helper, for snippets
```

`t` should be the effect's own natural 0…1: position along the tail, particle life, field
strength, node index. That is what makes a gradient read as part of the motion.

## House rules

1. **Hide the native pointer narrowly.** `cursor: none` on a section, never the document.
2. **Never animate layout.** Only `transform` and `opacity`, one write per frame.
3. **Degrade honestly.** Gate generated snippets on `(pointer: fine)`.
4. **No dependencies.** If it needs a package, it does not belong here.

## Before opening a PR

- Every language tab produces code that runs as pasted.
- Switching away from your cursor leaves no elements or canvases behind.
- The page still does not scroll.
- No console errors or warnings.
