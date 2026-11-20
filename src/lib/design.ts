/* Drawn cursors: scale, tint, the CSS cursor value and the generated code.
   Ported from the vanilla controller, behaviour unchanged. */
import { FX, type Code, type DesignEntry, type Param, type Values } from '@/cursors'

function scaleSvg(svg: string, k: number) {
  return svg.replace(/^(<svg[^>]*?)width="([\d.]+)"([^>]*?)height="([\d.]+)"/, (_m, a, w, mid, h) =>
    a + 'width="' + Math.min(128, Math.round(w * k)) + '"' + mid +
    'height="' + Math.min(128, Math.round(h * k)) + '"')
}

const encode = (s: string) => encodeURIComponent(s).replace(/'/g, '%27')

/* White is the paintable area of every mono cursor. Two regexes on purpose:
   .test() on a /g regex keeps lastIndex between calls and answers wrongly
   every other time, which the old controller did. */
const WHITE_ANY = /#ffffff\b|#fff\b/i
const WHITE_ALL = /#ffffff\b|#fff\b/gi

export const tintable = (svg: string) => WHITE_ANY.test(svg)

function tintSvg(svg: string, paint: unknown) {
  const pv = FX.pnorm(paint)
  if (!tintable(svg)) return svg
  if (!pv.on) return svg.replace(WHITE_ALL, pv.a)
  const id = 'clt' + Math.random().toString(36).slice(2, 7)
  const defs = '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0.35" y2="1">' +
    '<stop offset="0" stop-color="' + pv.a + '"/><stop offset="1" stop-color="' + pv.b + '"/>' +
    '</linearGradient></defs>'
  return svg.replace(WHITE_ALL, 'url(#' + id + ')').replace(/(<svg[^>]*>)/, '$1' + defs)
}

export function renderSvg(e: DesignEntry, p: Values) {
  return scaleSvg(tintSvg(e.svg, p.tint), (p.scale as number) || 1)
}

export function hotspot(e: DesignEntry, p: Values): [number, number] {
  const k = (p.scale as number) || 1
  return [Math.round(e.hot[0] * k), Math.round(e.hot[1] * k)]
}

export function cursorValue(e: DesignEntry, p: Values) {
  const [x, y] = hotspot(e, p)
  return 'url("data:image/svg+xml,' + encode(renderSvg(e, p)) + '") ' + x + ' ' + y + ', auto'
}

function prettySvg(s: string) {
  let depth = 0
  return s.replace(/></g, '>\n<').split('\n').map((line) => {
    if (/^<\//.test(line)) depth = Math.max(0, depth - 1)
    const out = '  '.repeat(depth) + line
    if (/^<[^/!?]/.test(line) && !/\/>$/.test(line) && !/<\/[a-zA-Z]/.test(line)) depth++
    return out
  }).join('\n')
}

const pascal = (id: string) => id.replace(/(^|-)(\w)/g, (_m, _a, b: string) => b.toUpperCase())

export function designCode(e: DesignEntry, p: Values): Code {
  const val = cursorValue(e, p)
  const [x, y] = hotspot(e, p)
  return {
    css:
      '/* ' + e.name + ' · hotspot ' + x + ' ' + y + ' */\n' +
      '.cursor-' + e.id + ' {\n  cursor: ' + val + ';\n}\n\n' +
      '/* Keep the ", auto" fallback: a browser that rejects the image\n' +
      '   falls back to it instead of showing no cursor at all.\n' +
      '   Anything wider than 128px is ignored outright. */',
    svg: prettySvg(renderSvg(e, p)),
    react:
      "const CURSOR =\n  '" + val.replace(/'/g, "\\'") + "';\n\n" +
      'export function ' + pascal(e.id) + 'Zone({ children }) {\n' +
      '  // No listeners, no re-renders: the OS draws it.\n' +
      '  return <div style={{ cursor: CURSOR }}>{children}</div>;\n' +
      '}',
  }
}

/* drawn cursors get two params: a scale, and a tint when the art has white */
const cache = new Map<string, Param[]>()
export function designParams(e: DesignEntry): Param[] {
  let list = cache.get(e.id)
  if (!list) {
    list = [{ key: 'scale', label: 'Scale', type: 'range', min: 0.5, max: 3, step: 0.1, value: 1, unit: '×', rebuild: true }]
    if (tintable(e.svg)) {
      list.push({ key: 'tint', label: 'Tint', type: 'paint', rebuild: true, value: { a: '#FFFFFF', b: '#5B9BF6', on: false, angle: 90 } })
    }
    cache.set(e.id, list)
  }
  return list
}
