/* Cursor params ↔ a DialKit config.

   DialKit labels a control by its key (formatLabel: first letter up, a space
   before every later capital), so the human label is the key. Group names in
   the databases are uppercase, which formatLabel would spell out letter by
   letter, so they become sentence case here. Each paint becomes a folder of
   Fill, Gradient and, while the gradient is on, End. */
import type { DialConfig } from 'dialkit'
import type { Paint, Param, Values } from '@/cursors'
import { toHex } from '@/lib/color'

const SHOW_UNIT = new Set(['px', 's', 'ms', 'deg', '%'])

export const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()

/* dots are DialKit path separators; nothing in the databases uses one, but a
   contributor might */
const keyOf = (p: Param) => {
  const base = p.label.replace(/\./g, '·')
  return p.type === 'range' && p.unit && SHOW_UNIT.has(p.unit) ? `${base} (${p.unit})` : base
}

const groupOf = (p: Param) => (p.group ? sentence(p.group) : null)

export function snap(p: Extract<Param, { type: 'range' }>, v: number) {
  const n = Math.round((v - p.min) / p.step)
  const decimals = (String(p.step).split('.')[1] || '').length
  return +Math.min(p.max, Math.max(p.min, p.min + n * p.step)).toFixed(decimals)
}

/* which paints currently have their gradient on: part of the config, so
   switching it adds or removes the End row */
export const paintFlags = (params: Param[], p: Values) =>
  params.filter((d) => d.type === 'paint').map((d) => ((p[d.key] as Paint)?.on ? 1 : 0)).join('')

/* Defaults always come from the database, never from the values in use:
   DialKit's resetValues() restores the config defaults, and the config is
   rebuilt whenever a gradient is switched. `ends` says which paints show
   their End row right now. */
function control(d: Param, end: boolean): DialConfig[string] {
  switch (d.type) {
    case 'range': return [d.value, d.min, d.max, d.step]
    case 'switch': return d.value
    case 'select': return { type: 'select', options: d.options, default: d.value }
    case 'text': return { type: 'text', default: d.value }
    case 'paint': {
      const folder: DialConfig = { Fill: toHex(d.value.a), Gradient: d.value.on }
      if (end) folder.End = toHex(d.value.b)
      return folder
    }
  }
}

export function buildConfig(params: Param[], ends: string): DialConfig {
  const config: DialConfig = {}
  let i = 0
  for (const d of params) {
    const g = groupOf(d)
    const target = g ? ((config[g] ??= { _collapsed: true } as unknown as DialConfig) as DialConfig) : config
    target[keyOf(d)] = control(d, d.type === 'paint' && ends[i++] === '1')
  }
  config.Reset = { type: 'action', label: 'Reset to defaults' }
  return config
}

type Tree = Record<string, unknown>

/* prev keeps a paint's second stop while its gradient is off, so switching
   the gradient on starts from the colour it had, not from a copy of Fill */
export function readValues(params: Param[], values: Tree, prev: Values): Values {
  const out: Values = {}
  for (const d of params) {
    const g = groupOf(d)
    const scope = (g ? values[g] : values) as Tree | undefined
    const raw = scope?.[keyOf(d)]
    if (raw === undefined) continue
    switch (d.type) {
      case 'range': out[d.key] = snap(d, Number(raw)); break
      case 'switch': out[d.key] = Boolean(raw); break
      case 'select':
      case 'text': out[d.key] = String(raw); break
      case 'paint': {
        const f = raw as Tree
        const a = toHex(String(f.Fill ?? d.value.a))
        const on = Boolean(f.Gradient)
        const kept = (prev[d.key] as Paint | undefined)?.b ?? d.value.b
        out[d.key] = { a, b: on ? toHex(String(f.End ?? kept)) : kept, on, angle: d.value.angle ?? 90 }
        break
      }
    }
  }
  return out
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
