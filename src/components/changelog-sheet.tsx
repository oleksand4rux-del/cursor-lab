import { BottomSheet } from '@/components/motion/bottom-sheet'
import { CHANGELOG } from '@/data/changelog'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

/* Newest first, on a rule down the left. Only the latest release carries the
   accent, the way the catalogue marks the cursor in use. */
export function ChangelogSheet({ open, onOpenChange }: Props) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[0.72, 0.92]}
      title="Changelog"
      description="What changed in Cursor Lab, newest first"
      className="max-w-2xl"
    >
      <ol className="relative mt-2 border-l border-border pl-6">
        {CHANGELOG.map((r, i) => (
          <li key={r.date} className="relative pb-8 last:pb-2">
            <span
              aria-hidden="true"
              className={
                'absolute -left-[29px] top-1.5 size-2.5 rounded-full ring-4 ring-background ' +
                (i === 0 ? 'bg-brand' : 'bg-faint')
              }
            />
            <time dateTime={r.date} className="text-xs tabular-nums text-faint">{r.date}</time>
            <h3 className="mt-1 text-[15px] font-medium text-foreground">{r.title}</h3>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm text-muted-foreground">
              {r.notes.map((n) => (
                <li key={n} className="flex gap-2">
                  <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-faint" />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </BottomSheet>
  )
}
