import { useEffect, useMemo, useRef, useState } from 'react'
import { useDialKitController } from 'dialkit'
import type { Entry, Param, Values } from '@/cursors'
import { buildConfig, paintFlags, readValues } from '@/lib/dial'

type Props = {
  entry: Entry
  params: Param[]
  /** the live object the effect reads every frame */
  p: Values
  onValues: (next: Values) => void
}

/* One DialKit panel per cursor. It renders nothing itself: DialRoot draws
   every registered panel in its floating window. The stable id keeps a
   cursor's tuning when you leave it and come back. */
export function CursorDial({ entry, params, p, onValues }: Props) {
  const [ends, setEnds] = useState(() => paintFlags(params, p))
  const config = useMemo(() => buildConfig(params, ends), [params, ends])

  const dialRef = useRef<{ resetValues: () => void } | null>(null)
  const options = useMemo(
    () => ({
      id: `cursor-${entry.kind}-${entry.id}`,
      onAction(path: string) {
        if (path === 'Reset') dialRef.current?.resetValues()
      },
    }),
    [entry.kind, entry.id],
  )

  const dial = useDialKitController(entry.name, config, options)
  dialRef.current = dial

  const pRef = useRef(p)
  pRef.current = p
  const onValuesRef = useRef(onValues)
  onValuesRef.current = onValues

  useEffect(() => {
    const next = readValues(params, dial.values as Record<string, unknown>, pRef.current)
    onValuesRef.current(next)
    const flags = paintFlags(params, { ...pRef.current, ...next })
    setEnds((prev) => (prev === flags ? prev : flags))
  }, [dial.values, params])

  return null
}
