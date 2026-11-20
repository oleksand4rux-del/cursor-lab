import { ANIMATED, DESIGN, type Code, type Entry, type Param, type Tab, type Values } from '@/cursors'
import { designCode, designParams } from '@/lib/design'

export const listOf = (tab: Tab): Entry[] => (tab === 'design' ? DESIGN : ANIMATED)

export const paramsOf = (e: Entry): Param[] => (e.kind === 'design' ? designParams(e) : e.params ?? [])

export const codeOf = (e: Entry, p: Values): Code => (e.kind === 'design' ? designCode(e, p) : e.code(p))

/* catalogue order keeps the database order; groups appear where they start */
export function groupsOf(list: Entry[]) {
  const out: { name: string; items: Entry[] }[] = []
  for (const e of list) {
    const last = out[out.length - 1]
    if (last && last.name === e.group) last.items.push(e)
    else out.push({ name: e.group, items: [e] })
  }
  return out
}

export const LANGS: Record<Tab, ('js' | 'react' | 'css' | 'svg')[]> = {
  animated: ['js', 'react', 'css'],
  design: ['css', 'svg', 'react'],
}
