/* Cursor params ↔ a DialKit config.

   DialKit labels a control by its key (formatLabel: first letter up, a space
   before every later capital), so the human label is the key. Group names in
   the databases are uppercase, which formatLabel would spell out letter by
   letter, so they become sentence case here.

   Every panel opens with a Colours folder: Shuffle and Randomize, then the
   cursor's paints. One paint lays out flat (Fill, Gradient, End); several get
   a folder each. End only exists while that paint's gradient is on. */
import type { DialConfig } from 'dialkit'
import type { Paint, PaintParam, Param, Values } from '@/cursors'
import { toHex } from '@/lib/color'

const SHOW_UNIT = new Set(['px', 's', 'ms', 'deg', '%'])
export const COLOURS = 'Colours'
export const SHUFFLE = 'Shuffle colours'
export const RANDOMIZE = 'Randomize gradient'
export const RESET = 'Reset to defaults'

export const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()

/* dots are DialKit path separators; nothing in the databases uses one, but a
   contributor might */
const keyOf = (p: Param) => {
  const base = p.label.replace(/\./g, '·')
  return p.type === 'range' && p.unit && SHOW_UNIT.has(p.unit) ? `${base} (${p.unit})` : base
}

const groupOf = (p: Param) => (p.group ? sentence(p.group) : null)

export const paintsOf = (params: Param[]) => params.filter((d): d is PaintParam => d.type === 'paint')

/* where a paint's Fill/Gradient/End live inside the config */
export function paintPath(params: Param[], d: PaintParam): string[] {
  return paintsOf(params).length === 1 ? [COLOURS] : [COLOURS, keyOf(d)]
}

export function snap(p: Extract<Param, { type: 'range' }>, v: number) {
  const n = Math.round((v - p.min) / p.step)
  const decimals = (String(p.step).split('.')[1] || '').length
  return +Math.min(p.max, Math.max(p.min, p.min + n * p.step)).toFixed(decimals)
}

/* which paints have their gradient on: part of the config, so switching it
   adds or removes the End row */
export const paintFlags = (params: Param[], p: Values) =>
  paintsOf(params).map((d) => ((p[d.key] as Paint)?.on ? 1 : 0)).join('')

function paintFolder(d: PaintParam, end: boolean): DialConfig {
  const folder: DialConfig = { Fill: toHex(d.value.a), Gradient: d.value.on }
  if (end) folder.End = toHex(d.value.b)
  return folder
}

/* Defaults always come from the database, never from the values in use:
   DialKit's resetValues() restores the config defaults, and the config is
   rebuilt whenever a gradient is switched. */
function control(d: Exclude<Param, PaintParam>): DialConfig[string] {
  switch (d.type) {
    case 'range': return [d.value, d.min, d.max, d.step]
    case 'switch': return d.value
    case 'select': return { type: 'select', options: d.options, default: d.value }
    case 'text': return { type: 'text', default: d.value }
  }
}

export function buildConfig(params: Param[], ends: string): DialConfig {
  const config: DialConfig = {}
  const paints = paintsOf(params)

  if (paints.length) {
    const colours: DialConfig = {
      [SHUFFLE]: { type: 'action', label: SHUFFLE },
      [RANDOMIZE]: { type: 'action', label: RANDOMIZE },
    }
    paints.forEach((d, i) => {
      const folder = paintFolder(d, ends[i] === '1')
      if (paints.length === 1) Object.assign(colours, folder)
      /* several paints fold away, so Shuffle and Randomize stay in reach */
      else colours[keyOf(d)] = { _collapsed: true, ...folder } as unknown as DialConfig
    })
    config[COLOURS] = colours
  }

  for (const d of params) {
    if (d.type === 'paint') continue
    const g = groupOf(d)
    const target = g ? ((config[g] ??= { _collapsed: true } as unknown as DialConfig) as DialConfig) : config
    target[keyOf(d)] = control(d)
  }

  config[RESET] = { type: 'action', label: RESET }
  return config
}

type Tree = Record<string, unknown>

const at = (tree: Tree, path: string[]) =>
  path.reduce<unknown>((node, k) => (node && typeof node === 'object' ? (node as Tree)[k] : undefined), tree) as Tree | undefined

/* prev keeps a paint's second stop while its gradient is off, so switching
   the gradient on starts from the colour it had, not from a copy of Fill */
export function readValues(params: Param[], values: Tree, prev: Values): Values {
  const out: Values = {}
  for (const d of params) {
    if (d.type === 'paint') {
      const f = at(values, paintPath(params, d))
      if (!f) continue
      const a = toHex(String(f.Fill ?? d.value.a))
      const on = Boolean(f.Gradient)
      const kept = (prev[d.key] as Paint | undefined)?.b ?? d.value.b
      out[d.key] = { a, b: on ? toHex(String(f.End ?? kept)) : kept, on, angle: d.value.angle ?? 90 }
      continue
    }
    const g = groupOf(d)
    const raw = (g ? at(values, [g]) : values)?.[keyOf(d)]
    if (raw === undefined) continue
    switch (d.type) {
      case 'range': out[d.key] = snap(d, Number(raw)); break
      case 'switch': out[d.key] = Boolean(raw); break
      case 'select':
      case 'text': out[d.key] = String(raw); break
    }
  }
  return out
}

/* ── Shuffle and Randomize ─────────────────────────────────
   Colours that read on the graphite stage. A cursor with several paints
   (Eyes: button, sclera, pupil, label) may also draw a near black, or every
   shuffle would leave the pupil the same tone as the sclera. */
const PALETTE = ['#ffffff', '#5b9bf6', '#a78bfa', '#ff6fae', '#ffb547', '#4cc38a', '#ff6b5b', '#7dd3fc']
const DARK = '#141415'

function draw(n: number, withDark: boolean) {
  const pool = withDark ? [...PALETTE, DARK] : [...PALETTE]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, n)
}

function setIn(tree: Tree, path: string[], leaf: Tree) {
  let node = tree
  for (const k of path) node = (node[k] ??= {}) as Tree
  Object.assign(node, leaf)
}

/* new solid colours, every gradient off */
export function shuffleUpdate(params: Param[]): Tree {
  const paints = paintsOf(params)
  const picks = draw(paints.length, paints.length > 1)
  const tree: Tree = {}
  paints.forEach((d, i) => setIn(tree, paintPath(params, d), { Fill: picks[i], Gradient: false }))
  return tree
}

/* every paint becomes a two-stop gradient. End only exists once the config
   has been rebuilt with the gradient on, so it is returned separately and
   applied a render later. */
export function randomizeUpdate(params: Param[]): { now: Tree; later: Tree } {
  const paints = paintsOf(params)
  const now: Tree = {}, later: Tree = {}
  paints.forEach((d) => {
    const [a, b] = draw(2, false)
    setIn(now, paintPath(params, d), { Fill: a, Gradient: true })
    setIn(later, paintPath(params, d), { End: b })
  })
  return { now, later }
}

export function defaults(params: Param[]): Values {
  const out: Values = {}
  for (const d of params) out[d.key] = d.type === 'paint' ? { ...d.value } : d.value
  return out
}

/* equal enough to skip a frame: paints compare by value */
export function same(a: unknown, b: unknown) {
  if (a === b) return true
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const x = a as Paint, y = b as Paint
    return x.a === y.a && x.b === y.b && x.on === y.on
  }
  return false
}
