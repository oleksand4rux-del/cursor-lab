/* The engine and the databases are classic scripts that write globals:
   FX, ANIM_DB, DESIGN_DB. Imported in this order, they run once and the
   React shell reads the result. */
import './engine.js'
import './db-design.js'
import './db-pointer.js'
import './db-trail.js'
import './db-field.js'

import type { AnimEntry, DesignEntry, FXRuntime } from './types'

type Globals = {
  FX: FXRuntime
  ANIM_DB: Omit<AnimEntry, 'kind'>[]
  DESIGN_DB: Omit<DesignEntry, 'kind'>[]
}
const g = window as unknown as Globals

/* hot reload re-runs a database file and pushes its entries a second time */
function unique<T extends { id: string }>(list: T[]): T[] {
  const seen = new Set<string>()
  return list.filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)))
}

export const FX = g.FX
export const ANIMATED: AnimEntry[] = unique(g.ANIM_DB).map((e) => ({ ...e, kind: 'animated' as const }))
export const DESIGN: DesignEntry[] = unique(g.DESIGN_DB).map((e) => ({ ...e, kind: 'design' as const }))

export const TOTAL = ANIMATED.length + DESIGN.length

export * from './types'
