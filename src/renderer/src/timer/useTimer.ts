import { useEffect, useRef } from 'react'
import { useTimerStore } from './timerStore'

export function useTimer() {
  const unsubRef = useRef<(() => void) | null>(null)
  const syncFromMain = useTimerStore((s) => s.syncFromMain)

  useEffect(() => {
    let cancelled = false
    syncFromMain().then((unsub) => {
      if (!cancelled) unsubRef.current = unsub
    })
    return () => {
      cancelled = true
      unsubRef.current?.()
    }
  }, [syncFromMain])

  return {
    start: () => window.api.timer.start(),
    pause: () => window.api.timer.pause(),
    resume: () => window.api.timer.resume(),
    stop: (summary: string) => window.api.timer.stop(summary)
  }
}
