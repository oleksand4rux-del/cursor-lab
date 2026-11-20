/* DialKit hands back any CSS colour the picker can produce: 8-digit hex,
   oklch(), color(display-p3 …). The effects build rgba() strings from a
   6-digit hex, so everything is flattened to that by painting one pixel. */
let ctx: CanvasRenderingContext2D | null = null

const hex2 = (n: number) => n.toString(16).padStart(2, '0')

export function toHex(css: string, fallback = '#ffffff'): string {
  if (/^#[0-9a-f]{6}$/i.test(css)) return css.toLowerCase()
  if (/^#[0-9a-f]{3}$/i.test(css)) return ('#' + css.slice(1).split('').map((c) => c + c).join('')).toLowerCase()
  if (/^#[0-9a-f]{8}$/i.test(css)) return css.slice(0, 7).toLowerCase()
  if (!ctx) {
    const c = document.createElement('canvas')
    c.width = c.height = 1
    ctx = c.getContext('2d', { willReadFrequently: true })
  }
  if (!ctx) return fallback
  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = fallback
  ctx.fillStyle = css
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return '#' + hex2(r) + hex2(g) + hex2(b)
}
