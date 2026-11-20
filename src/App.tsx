import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DialRoot } from 'dialkit'
import { Check, Code2, Copy, History } from 'lucide-react'
import { Dock, DockItem, DockSeparator } from '@/components/motion/dock'
import { Tooltip, TooltipProvider } from '@/components/motion/tooltip'
import { Catalogue } from '@/components/catalogue'
import { ChangelogSheet } from '@/components/changelog-sheet'
import { CursorDial } from '@/components/cursor-dial'
import { GithubMark } from '@/components/icons'
import { SourceSheet, type Lang } from '@/components/source-sheet'
import { Stage, type StageHandle } from '@/components/stage'
import { TOTAL, type Tab, type Values } from '@/cursors'
import { LANGS, codeOf, listOf, paramsOf } from '@/lib/catalog'
import { defaults, same } from '@/lib/dial'
import { dressDialKit } from '@/lib/dialkit-dress'
import { copyText } from '@/lib/highlight'
import { REPO_URL, isoDate, shortCount, useGitHub } from '@/lib/use-github'

/* p objects live for the whole session, one per cursor, so leaving a cursor
   and coming back keeps its tuning (DialKit keeps its panel by id too) */
const store = new Map<string, Values>()

const ICON = 'size-[18px]'
const narrow = () => window.matchMedia('(max-width: 767px)').matches

function Hint({ label, keys }: { label: string; keys: string }) {
  return (
    <span className="flex items-center gap-2">
      {label}
      <kbd>{keys}</kbd>
    </span>
  )
}

export default function App() {
  const [tab, setTab] = useState<Tab>('animated')
  const [selected, setSelected] = useState(() => listOf('animated')[0].id)
  const [sheet, setSheet] = useState(false)
  /* the changelog has its own address, cursor-lab-ui.vercel.app/#changelog */
  const [log, setLog] = useState(() => window.location.hash === '#changelog')
  const [lang, setLang] = useState<Lang>('js')
  const [copied, setCopied] = useState(false)
  const [codeTick, setCodeTick] = useState(0)
  const stage = useRef<StageHandle>(null)
  const readout = useRef<HTMLSpanElement>(null)
  const gh = useGitHub()

  const list = listOf(tab)
  const entry = list.find((e) => e.id === selected) ?? list[0]
  const params = useMemo(() => paramsOf(entry), [entry])
  const storeKey = entry.kind + ':' + entry.id
  if (!store.has(storeKey)) store.set(storeKey, defaults(params))
  const p = store.get(storeKey)!

  const langs = LANGS[tab]
  // codeTick: p is mutated in place, so the code is rebuilt on each edit
  const code = useMemo(() => codeOf(entry, p), [entry, p, codeTick]) // eslint-disable-line react-hooks/exhaustive-deps
  const activeLang = langs.includes(lang) && code[lang] ? lang : (langs.find((l) => code[l]) ?? langs[0])

  const onValues = useCallback(
    (next: Values) => {
      let changed = false, rebuild = false
      for (const d of params) {
        if (!(d.key in next) || same(p[d.key], next[d.key])) continue
        p[d.key] = next[d.key]
        changed = true
        if (d.rebuild || entry.kind === 'design') rebuild = true
      }
      if (!changed) return
      if (rebuild) stage.current?.remount()
      else stage.current?.poke()
      setCodeTick((n) => n + 1)
    },
    [params, p, entry.kind],
  )

  const selectTab = useCallback((t: Tab) => {
    setTab(t)
    setSelected(listOf(t)[0].id)
    setLang(LANGS[t][0])
  }, [])

  const copy = useCallback(async () => {
    const ok = await copyText(codeOf(entry, p)[activeLang] ?? '')
    if (!ok) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }, [entry, p, activeLang])

  /* the signature: where the pointer is on the mat, in stage pixels.
     Written straight to the node, so moving the mouse never re-renders. */
  const onPointer = useCallback((x: number | null, y: number | null) => {
    const el = readout.current
    if (!el) return
    el.textContent = x === null || y === null ? '–' : `${Math.round(x)}, ${Math.round(y)}`
  }, [])

  const openLog = useCallback((open: boolean) => {
    setLog(open)
    const url = window.location.pathname + window.location.search + (open ? '#changelog' : '')
    window.history.replaceState(null, '', url)
  }, [])
  useEffect(() => {
    const onHash = () => setLog(window.location.hash === '#changelog')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  /* accent on the colour actions, booleans as switches (see dialkit-dress) */
  useEffect(() => dressDialKit(), [])

  /* keyboard: j and k walk the catalogue, c copies, e opens the source.
     Ignored while typing, inside the tree, a dialog, or a DialKit control. */
  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return
      const el = document.activeElement as HTMLElement | null
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.closest('.dialkit-root, [role="tree"], [role="dialog"]'))) return
      const items = listOf(tab), i = items.findIndex((x) => x.id === entry.id)
      const k = ev.key.toLowerCase()
      if (k === 'j') setSelected(items[(i + 1) % items.length].id)
      else if (k === 'k') setSelected(items[(i - 1 + items.length) % items.length].id)
      else if (k === 'c') void copy()
      else if (k === 'e') setSheet((s) => !s)
      else return
      ev.preventDefault()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [tab, entry.id, copy])

  return (
    <TooltipProvider>
      <main className="fixed inset-0 overflow-hidden">
        <h1 className="sr-only">Cursor Lab, {TOTAL} custom cursors to tune and copy</h1>

        <Stage ref={stage} entry={entry} p={p} onPointer={onPointer} className="stage absolute inset-0" />

        {/* catalogue */}
        <aside className="panel absolute left-2 right-16 top-2 flex max-h-[40vh] flex-col p-2 md:right-auto md:bottom-4 md:left-4 md:top-4 md:max-h-none md:w-64">
          <header className="flex h-10 items-center gap-2 px-2">
            <img src="/assets/logo.png" alt="" width={20} height={20} className="size-5 rounded-[5px]" />
            <span className="text-[15px] font-medium">Cursor Lab</span>
          </header>
          <Catalogue tab={tab} onTab={selectTab} selected={entry.id} onSelect={setSelected} className="mt-1 min-h-0 flex-1" />
          <footer className="mt-2 hidden flex-col gap-1 border-t border-border px-2 pt-3 pb-1 text-xs text-faint md:flex">
            <a href="https://yrmn.me/" target="_blank" rel="noopener" className="w-fit transition-colors hover:text-foreground">
              Made by <span className="text-muted-foreground">Oleksandr Yeromin</span>
            </a>
            <span>
              Updated{' '}
              <time className="tabular-nums" dateTime={gh.updated.toISOString()} title="Last push to GitHub">
                {isoDate(gh.updated)}
              </time>
            </span>
          </footer>
        </aside>

        {/* tools */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 md:bottom-4">
          <Dock size={40} className="items-center rounded-2xl bg-card shadow-[0_12px_32px_rgb(0_0_0/0.36)] backdrop-blur-none">
            <span
              ref={readout}
              aria-hidden="true"
              title="Pointer on the stage, in pixels"
              className="hidden w-[84px] px-2 text-center text-[13px] tabular-nums text-faint md:block"
            >
              –
            </span>
            <DockSeparator className="hidden md:block" />
            <Tooltip content={<Hint label="Source" keys="E" />} side="top">
              <DockItem onClick={() => setSheet(true)} active={sheet} aria-label="Source">
                <Code2 className={ICON} strokeWidth={1.5} />
              </DockItem>
            </Tooltip>
            <Tooltip content={copied ? 'Copied' : <Hint label="Copy code" keys="C" />} side="top">
              <DockItem onClick={copy} aria-label="Copy code">
                {copied ? <Check className={ICON} strokeWidth={1.5} /> : <Copy className={ICON} strokeWidth={1.5} />}
              </DockItem>
            </Tooltip>
            <Tooltip content="Changelog" side="top">
              <DockItem onClick={() => openLog(true)} active={log} aria-label="Changelog">
                <History className={ICON} strokeWidth={1.5} />
              </DockItem>
            </Tooltip>
            <DockSeparator />
            <Tooltip content="Source on GitHub" side="top">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener"
                aria-label={gh.stars !== null ? `GitHub, ${gh.stars} stars` : 'GitHub'}
                className="flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-raised hover:text-foreground"
              >
                <GithubMark className="size-4" />
                {gh.stars !== null ? <span className="tabular-nums">{shortCount(gh.stars)}</span> : null}
              </a>
            </Tooltip>
          </Dock>
        </div>

        <SourceSheet
          open={sheet}
          onOpenChange={setSheet}
          title={entry.name}
          code={code}
          langs={langs}
          lang={activeLang}
          onLang={setLang}
          copied={copied}
          onCopy={copy}
        />

        <ChangelogSheet open={log} onOpenChange={openLog} />

        <CursorDial key={storeKey} entry={entry} params={params} p={p} onValues={onValues} />
        <DialRoot position="top-right" theme="dark" productionEnabled defaultOpen={!narrow()} />
      </main>
    </TooltipProvider>
  )
}
