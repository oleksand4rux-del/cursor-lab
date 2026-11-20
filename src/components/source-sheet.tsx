import { useMemo, useState } from 'react'
import { Check, Copy, Terminal } from 'lucide-react'
import { CenterMorphModal, CenterMorphModalContent } from '@/components/motion/center-morph-modal'
import { Tabs, TabsList, TabsTrigger } from '@/components/motion/tabs'
import { ActionSwapBlurButton } from '@/components/motion/action-swap-blur'
import type { Code } from '@/cursors'
import { copyText, highlight } from '@/lib/highlight'

export type Lang = 'js' | 'react' | 'css' | 'svg'
const LABEL: Record<Lang, string> = { js: 'JavaScript', react: 'React', css: 'CSS', svg: 'SVG' }

const SITE = 'https://cursor-lab-ui.vercel.app'
export const installCommand = (id: string) => `npx shadcn@latest add ${SITE}/r/${id}.json`

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  id: string
  title: string
  code: Code
  langs: Lang[]
  lang: Lang
  onLang: (l: Lang) => void
  copied: boolean
  onCopy: () => void
}

/* One command for people and agents, then the code with the values in the
   panel. The command installs the default tuning; the tabs carry yours. */
export function SourceSheet({ open, onOpenChange, id, title, code, langs, lang, onLang, copied, onCopy }: Props) {
  const html = useMemo(() => highlight(code[lang] ?? ''), [code, lang])
  const cmd = installCommand(id)
  const [cmdCopied, setCmdCopied] = useState(false)

  async function copyCmd() {
    if (!(await copyText(cmd))) return
    setCmdCopied(true)
    window.setTimeout(() => setCmdCopied(false), 1400)
  }

  return (
    <CenterMorphModal open={open} onOpenChange={onOpenChange}>
      <CenterMorphModalContent
        ariaLabel={`${title} source`}
        className="max-w-3xl rounded-2xl bg-card"
        backdropClassName="bg-background/50 backdrop-blur-md"
      >
        <div className="flex flex-col gap-5 p-6">
          <header className="pr-10">
            <h2 className="text-[17px] font-medium">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Install it with one command, or copy the code you tuned</p>
          </header>

          <section aria-label="Install">
            <div className="mb-2 flex items-center gap-2 text-xs text-faint">
              <Terminal className="size-3.5" strokeWidth={1.5} />
              Install with the default tuning
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-deep py-1.5 pl-4 pr-1.5">
              <code className="code min-w-0 flex-1 truncate text-[13px] text-muted-foreground" title={cmd}>
                <span className="text-faint">$ </span>{cmd}
              </code>
              <button
                type="button"
                onClick={copyCmd}
                aria-label={cmdCopied ? 'Command copied' : 'Copy install command'}
                className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-raised hover:text-foreground"
              >
                {cmdCopied ? <Check className="size-4" strokeWidth={1.5} /> : <Copy className="size-4" strokeWidth={1.5} />}
              </button>
            </div>
          </section>

          <section aria-label="Code">
            <div className="flex items-center justify-between gap-3">
              <Tabs value={lang} onValueChange={(v) => onLang(v as Lang)} variant="underline">
                <TabsList>
                  {langs.map((l) => (
                    <TabsTrigger key={l} value={l}>{LABEL[l]}</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <ActionSwapBlurButton
                size="sm"
                variant="secondary"
                value={copied ? 'copied' : 'copy'}
                items={[
                  { id: 'copy', label: 'Copy', icon: <Copy className="size-3.5" /> },
                  { id: 'copied', label: 'Copied', icon: <Check className="size-3.5" /> },
                ]}
                onClick={onCopy}
              />
            </div>
            <pre className="code mt-3 max-h-[52vh] overflow-auto rounded-xl border border-border bg-deep p-4 text-[13px] leading-5">
              <code dangerouslySetInnerHTML={{ __html: html }} />
            </pre>
          </section>
        </div>
      </CenterMorphModalContent>
    </CenterMorphModal>
  )
}
