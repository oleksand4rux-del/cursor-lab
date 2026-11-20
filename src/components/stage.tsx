import { useEffect, useImperativeHandle, useRef, type Ref } from 'react'
import type { Entry, Values } from '@/cursors'
import { cursorValue, hotspot, renderSvg } from '@/lib/design'

export type StageHandle = {
  /** one frame on demand, so a dial edit lands while the pointer is away */
  poke: () => void
  /** recreate the effect, for params marked `rebuild` */
  remount: () => void
}

type Props = {
  entry: Entry
  p: Values
  ref?: Ref<StageHandle>
  /** pointer position in stage pixels, null when it leaves */
  onPointer?: (x: number | null, y: number | null) => void
  className?: string
}

type FxHost = HTMLDivElement & { __fx?: { poke?: () => void } | null }

/* The stage is plain DOM on purpose. Every effect in the databases mounts
   itself into this element and owns its children, so React renders an empty
   box and never reconciles inside it. */
export function Stage({ entry, p, ref, onPointer, className }: Props) {
  const el = useRef<FxHost>(null)
  const destroy = useRef<(() => void) | null>(null)
  const pRef = useRef(p)
  pRef.current = p

  function teardown() {
    try { destroy.current?.() } catch { /* an effect failing to clean up must not block the next */ }
    destroy.current = null
  }

  function mount() {
    const stage = el.current
    if (!stage) return
    teardown()
    stage.style.cursor = ''

    if (entry.kind === 'animated') {
      if (entry.hideCursor === false) stage.removeAttribute('data-hide')
      else stage.setAttribute('data-hide', '')
      stage.innerHTML = entry.content || ''
      try {
        destroy.current = entry.mount(stage, pRef.current) || null
      } catch (err) {
        console.warn('[cursor lab]', entry.id, err)
      }
      return
    }

    /* drawn cursors: the art at preview size, and the real cursor on the stage */
    stage.removeAttribute('data-hide')
    const [hx, hy] = hotspot(entry, pRef.current)
    stage.innerHTML =
      '<div class="stage__body"><div class="dsp">' +
      '<div class="dsp__art"' + (entry.pixel ? ' data-pixel="1"' : '') + '>' + renderSvg(entry, pRef.current) + '</div>' +
      '<p class="stage__note">Hotspot ' + hx + ', ' + hy + '</p>' +
      '</div></div>'
    stage.style.cursor = cursorValue(entry, pRef.current)

    const art = stage.querySelector('.dsp__art')
    const down = () => art?.classList.add('is-press')
    const up = () => art?.classList.remove('is-press')
    stage.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    destroy.current = () => {
      stage.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      stage.style.cursor = ''
    }
  }

  useImperativeHandle(ref, () => ({
    poke: () => el.current?.__fx?.poke?.(),
    remount: mount,
  }))

  useEffect(() => {
    mount()
    return teardown
    // recreated per entry (and per values object, which only changes with it);
    // param edits arrive through poke/remount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry, p])

  /* pointer readout, at most once a frame, independent of the effect */
  const onPointerRef = useRef(onPointer)
  onPointerRef.current = onPointer
  useEffect(() => {
    const stage = el.current
    if (!stage) return
    let raf = 0, x = 0, y = 0
    const flush = () => { raf = 0; onPointerRef.current?.(x, y) }
    const move = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect()
      x = e.clientX - r.left
      y = e.clientY - r.top
      if (!raf) raf = requestAnimationFrame(flush)
    }
    const leave = () => { cancelAnimationFrame(raf); raf = 0; onPointerRef.current?.(null, null) }
    stage.addEventListener('pointermove', move, { passive: true })
    stage.addEventListener('pointerleave', leave)
    return () => {
      cancelAnimationFrame(raf)
      stage.removeEventListener('pointermove', move)
      stage.removeEventListener('pointerleave', leave)
    }
  }, [])

  return <div ref={el} className={className} data-stage="" />
}
