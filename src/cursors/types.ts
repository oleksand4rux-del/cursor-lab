/* Shapes of the cursor databases. The databases themselves stay plain
   JavaScript (engine.js, db-*.js) so a contributor adds a cursor by pushing
   one object, exactly as before the React shell existed. */

export type Paint = { a: string; b: string; on: boolean; angle?: number }

type Base = {
  key: string
  label: string
  /** inspector folder; ungrouped params stay pinned at the top level */
  group?: string
  /** the effect has to be recreated when this one changes */
  rebuild?: boolean
}

export type RangeParam = Base & {
  type: 'range'
  min: number
  max: number
  step: number
  value: number
  unit?: string
}
export type SwitchParam = Base & { type: 'switch'; value: boolean }
export type SelectParam = Base & { type: 'select'; value: string; options: string[] }
export type TextParam = Base & { type: 'text'; value: string }
export type PaintParam = Base & { type: 'paint'; value: Paint }

export type Param = RangeParam | SwitchParam | SelectParam | TextParam | PaintParam
export type ParamValue = number | boolean | string | Paint
export type Values = Record<string, ParamValue>

export type Code = Partial<Record<'js' | 'react' | 'css' | 'svg', string>>

export type AnimEntry = {
  kind: 'animated'
  id: string
  name: string
  group: 'Pointer' | 'Trail' | 'Field'
  desc: string
  hideCursor?: boolean
  content?: string
  params: Param[]
  /** p is read live by the effect on every frame; returns its destroy */
  mount: (stage: HTMLElement, p: Values) => (() => void) | void
  code: (p: Values) => Code
}

export type DesignEntry = {
  kind: 'design'
  id: string
  name: string
  group: string
  svg: string
  hot: [number, number]
  pixel?: boolean
  desc?: string
}

export type Entry = AnimEntry | DesignEntry
export type Tab = 'design' | 'animated'

export type FXRuntime = {
  pnorm: (v: unknown) => Paint
}
