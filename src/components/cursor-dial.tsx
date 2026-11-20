import { useEffect, useMemo, useRef, useState } from 'react'
import { useDialKitController } from 'dialkit'
import type { Entry, Param, Values } from '@/cursors'
import {
  COLOURS, RANDOMIZE, RESET, SHUFFLE,
  buildConfig, paintFlags, randomizeUpdate, readValues, shuffleUpdate,
} from '@/lib/dial'

type Props = {
  entry: Entry
  params: Param[]
  /** the live object the effect reads every frame */
  p: Values
  onValues: (next: Values) => void
}

type Controller = ReturnType<typeof useDialKitController>

/* One DialKit panel per cursor. It renders nothing itself: DialRoot draws
   every registered panel in its floating window. The stable id keeps a
   cursor's tuning when you leave it and come back. */
export function CursorDial({ entry, params, p, onValues }: Props) {
  const [ends, setEnds] = useState(() => paintFlags(params, p))
  const config = useMemo(() => buildConfig(params, ends), [params, ends])

  const dialRef = useRef<Controller | null>(null)
  /* End rows a Randomize asked for, waiting for the config that has them */
  const pendingEnds = useRef<Record<string, unknown> | null>(null)

  const options = useMemo(
    () => ({
      id: `cursor-${entry.kind}-${entry.id}`,
      onAction(path: string) {
        const dial = dialRef.current
        if (!dial) return
        if (path === RESET) dial.resetValues()
        else if (path === `${COLOURS}.${SHUFFLE}`) dial.setValues(shuffleUpdate(params) as never)
        else if (path === `${COLOURS}.${RANDOMIZE}`) {
          const { now, later } = randomizeUpdate(params)
          pendingEnds.current = later
          dial.setValues(now as never)
        }
      },
    }),
    [entry.kind, entry.id, params],
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

  /* the config now carries the End rows: hand them their colours */
  useEffect(() => {
    if (!pendingEnds.current || !ends.includes('1')) return
    const later = pendingEnds.current
    pendingEnds.current = null
    dialRef.current?.setValues(later as never)
  }, [config, ends])

  return null
}
