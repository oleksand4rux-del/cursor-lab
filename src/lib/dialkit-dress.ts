/* DialKit draws every control itself. Two things are added to what it draws,
   by marking its DOM, so its components and behaviour stay its own:

   - Shuffle colours and Randomize gradient carry the accent; every other
     action stays neutral. DialKit renders all actions as the same button,
     so they are told apart by label.
   - A boolean is a two-button Off / On segment in DialKit. Marked here, it is
     dressed as a switch (index.css), and a press anywhere on it flips it, the
     way a switch works, instead of only the half you hit. */
import { RANDOMIZE, SHUFFLE } from '@/lib/dial'

const ACCENT = new Set([SHUFFLE, RANDOMIZE])
const SEG = '.dialkit-segmented-button'

function mark() {
  document.querySelectorAll<HTMLButtonElement>('.dialkit-root .dialkit-button').forEach((b) => {
    const want = ACCENT.has(b.textContent ?? '')
    if (want !== b.hasAttribute('data-accent')) b.toggleAttribute('data-accent', want)
  })
  document.querySelectorAll<HTMLElement>('.dialkit-root .dialkit-segmented').forEach((seg) => {
    const b = seg.querySelectorAll(`:scope > ${SEG}`)
    const sw = b.length === 2 && b[0].textContent === 'Off' && b[1].textContent === 'On'
    if (sw !== seg.hasAttribute('data-switch')) seg.toggleAttribute('data-switch', sw)
  })
}

/* Capture runs before React sees the click, so it reads the state the switch
   had when it was pressed. A press on the half that is already active would
   change nothing in DialKit; the other half is clicked instead, once the
   whole click has been dispatched. Not a microtask: those run between
   listeners, before React handles the original click, which then set the
   switch straight back. Clicks dispatched here are untrusted, which keeps
   this from looping. */
function onClick(e: MouseEvent) {
  if (!e.isTrusted) return
  const btn = (e.target as Element | null)?.closest?.(`.dialkit-segmented[data-switch] > ${SEG}`)
  if (!btn || btn.getAttribute('data-active') !== 'true') return
  const other = [...btn.parentElement!.querySelectorAll<HTMLButtonElement>(`:scope > ${SEG}`)].find((x) => x !== btn)
  if (other) window.setTimeout(() => other.click(), 0)
}

export function dressDialKit() {
  mark()
  const mo = new MutationObserver(mark)
  mo.observe(document.body, { childList: true, subtree: true, characterData: true })
  document.addEventListener('click', onClick, true)
  return () => {
    mo.disconnect()
    document.removeEventListener('click', onClick, true)
  }
}
