import { Modal } from '@/components/modal'
import { CHANGELOG } from '@/data/changelog'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

/* Releases newest first, one per row: the date in its own column, the title
   and notes beside it, hairlines between. The latest is marked in the accent,
   in words, the way the catalogue marks the cursor in use. */
export function ChangelogSheet({ open, onOpenChange }: Props) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Changelog"
      description="What changed in Cursor Lab, newest first"
      className="max-h-[min(80vh,720px)] max-w-2xl"
    >
      <ol className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-border px-6">
        {CHANGELOG.map((r, i) => (
          <li key={r.date} className="grid gap-x-6 gap-y-2 border-b border-border py-5 last:border-b-0 sm:grid-cols-[112px_1fr]">
            <div className="flex items-baseline gap-2 sm:flex-col sm:gap-1">
              <time dateTime={r.date} className="text-[13px] tabular-nums text-muted-foreground">{r.date}</time>
              {i === 0 ? <span className="text-xs text-brand">Latest</span> : null}
            </div>
            <div>
              <h3 className="text-[15px] font-medium text-foreground">{r.title}</h3>
              <ul className="mt-2 flex flex-col gap-1.5 text-sm text-muted-foreground">
                {r.notes.map((n) => (
                  <li key={n} className="flex gap-2.5">
                    <span aria-hidden="true" className="mt-[9px] size-1 shrink-0 rounded-full bg-faint" />
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </Modal>
  )
}
