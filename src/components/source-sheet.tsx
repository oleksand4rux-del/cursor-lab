import { useMemo } from 'react'
import { Check, Copy } from 'lucide-react'
import { BottomSheet } from '@/components/motion/bottom-sheet'
import { Tabs, TabsList, TabsTrigger } from '@/components/motion/tabs'
import { ActionSwapBlurButton } from '@/components/motion/action-swap-blur'
import type { Code } from '@/cursors'
import { highlight } from '@/lib/highlight'

export type Lang = 'js' | 'react' | 'css' | 'svg'
const LABEL: Record<Lang, string> = { js: 'JavaScript', react: 'React', css: 'CSS', svg: 'SVG' }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  code: Code
  langs: Lang[]
  lang: Lang
  onLang: (l: Lang) => void
  copied: boolean
  onCopy: () => void
}

export function SourceSheet({ open, onOpenChange, title, code, langs, lang, onLang, copied, onCopy }: Props) {
  const html = useMemo(() => highlight(code[lang] ?? ''), [code, lang])

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[0.62, 0.92]}
      title={title}
      description="Generated from the values in the panel"
      className="max-w-4xl"
    >
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
      <pre className="code mt-3 overflow-x-auto rounded-xl border border-border bg-card p-4 text-[13px] leading-5">
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </BottomSheet>
  )
}
