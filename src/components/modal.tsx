import { useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
import { useFocusTrap } from '@/lib/hooks/use-focus-trap'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  className?: string
}

/* One quiet entrance for every dialog: the stage blurs behind, the panel
   fades in and rises 8px. Escape, the backdrop or the close button shut it,
   and focus stays inside while it is open. */
const EASE = [0.22, 1, 0.36, 1] as const

export function Modal({ open, onOpenChange, title, description, children, className }: Props) {
  const panel = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const titleId = useId()
  const descId = useId()
  useFocusTrap(open, panel, { onEscape: () => onOpenChange(false) })

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[100] grid place-items-center p-4">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-background/55 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            className={cn(
              'relative flex max-h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_64px_rgb(0_0_0/0.5)] outline-none',
              className,
            )}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.99 }}
            transition={{ duration: 0.22, ease: EASE }}
          >
            <header className="flex items-start gap-4 px-6 pt-6 pb-4">
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="text-[17px] font-medium">{title}</h2>
                {description ? <p id={descId} className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
                className="-mr-2 -mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-raised hover:text-foreground"
              >
                <X className="size-4" strokeWidth={1.5} />
              </button>
            </header>
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
