import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DialRoot } from 'dialkit'
import { Code2, Copy, Check } from 'lucide-react'
import { GithubMark } from '@/components/icons'
import { Dock, DockItem, DockSeparator } from '@/components/motion/dock'
import { Tooltip, TooltipProvider } from '@/components/motion/tooltip'
import { Catalogue } from '@/components/catalogue'
import { CursorDial } from '@/components/cursor-dial'
import { SourceSheet, type Lang } from '@/components/source-sheet'
import { Stage, type StageHandle } from '@/components/stage'
import { TOTAL, type Tab, type Values } from '@/cursors'
import { LANGS, codeOf, listOf, paramsOf } from '@/lib/catalog'
import { defaults, same } from '@/lib/dial'
import { copyText } from '@/lib/highlight'
import { REPO_URL, isoDate, shortCount, useGitHub } from '@/lib/use-github'

/* p objects live for the whole session, one per cursor, so leaving a cursor
   and coming back keeps its tuning (DialKit keeps its panel by id too) */
const store = new Map<string, Values>()

export default function App() {
  const [tab, setTab] = useState<Tab>('animated')
  const [selected, setSelected] = useState(() => listOf('animated')[0].id)
  const [sheet, setSheet] = useState(false)
  const [lang, setLang] = useState<Lang>('js')
  const [copied, setCopied] = useState(false)
  const [codeTick, setCodeTick] = useState(0)
  const stage = useRef<StageHandle>(null)
  const gh = useGitHub()

  const list = listOf(tab)
  const entry = list.find((e) => e.id === selected) ?? list[0]
  const params = useMemo(() => paramsOf(entry), [entry])
  const storeKey = entry.kind + ':' + entry.id
  if (!store.has(storeKey)) store.set(storeKey, defaults(params))
  const p = store.get(storeKey)!

  const langs = LANGS[tab]
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

  /* keyboard: j/k walk the catalogue, c copies, e opens the source.
     Ignored while typing or while a DialKit control has focus. */
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
      <div className="fixed inset-0 overflow-hidden bg-background text-foreground">
        <Stage ref={stage} entry={entry} p={p} className="stage absolute inset-0" />

        <aside className="panel absolute left-4 top-4 bottom-4 flex w-72 flex-col p-3">
          <header className="mb-3 flex items-center gap-2 px-1">
            <img src="/assets/logo.png" alt="" width={20} height={20} className="size-5 rounded-[5px]" />
            <span className="font-medium">Cursor Lab</span>
            <span className="ml-auto text-xs tabular-nums text-muted-foreground">{TOTAL} cursors</span>
          </header>
          <Catalogue
            tab={tab}
            onTab={selectTab}
            selected={entry.id}
            onSelect={setSelected}
            className="min-h-0 flex-1"
          />
          <footer className="mt-3 flex items-center gap-2 border-t border-border px-1 pt-3 text-xs text-muted-foreground">
            <a href="https://www.linkedin.com/in/oleksand4r/" target="_blank" rel="noopener" className="hover:text-foreground">
              Made by <span className="text-foreground">Oleksandr Yeromin</span>
            </a>
            <span className="ml-auto tabular-nums" title="Last push to GitHub">{isoDate(gh.updated)}</span>
          </footer>
        </aside>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <Dock size={40}>
            <Tooltip content="Source  E" side="top">
              <DockItem onClick={() => setSheet(true)} active={sheet} aria-label="Source">
                <Code2 className="size-[18px]" strokeWidth={1.5} />
              </DockItem>
            </Tooltip>
            <Tooltip content={copied ? 'Copied' : 'Copy code  C'} side="top">
              <DockItem onClick={copy} aria-label="Copy code">
                {copied ? <Check className="size-[18px]" strokeWidth={1.5} /> : <Copy className="size-[18px]" strokeWidth={1.5} />}
              </DockItem>
            </Tooltip>
            <DockSeparator />
            <Tooltip content="Source on GitHub" side="top">
              <DockItem aria-label="Source on GitHub">
                <a href={REPO_URL} target="_blank" rel="noopener" className="flex items-center gap-1 px-1 text-sm">
                  <GithubMark className="size-4" />
                  {gh.stars !== null ? <span className="tabular-nums text-muted-foreground">{shortCount(gh.stars)}</span> : null}
                </a>
              </DockItem>
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

        <CursorDial key={storeKey} entry={entry} params={params} p={p} onValues={onValues} />
        <DialRoot position="top-right" theme="dark" productionEnabled />
      </div>
    </TooltipProvider>
  )
}
