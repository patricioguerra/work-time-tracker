import { Play, Pause, Square } from 'lucide-react'
import { useTimerStore } from './timerStore'

interface TimerControlsProps {
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
}

const baseBtn =
  'inline-flex items-center justify-center gap-2 rounded-md text-[13px] font-medium tracking-wide transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40'

const primaryBtn = `${baseBtn} border border-primary/25 bg-primary/8 px-7 py-2.5 text-primary hover:border-primary/45 hover:bg-primary/15`

const outlineBtn = `${baseBtn} border border-border bg-transparent px-5 py-2.5 text-muted-foreground hover:border-border/80 hover:bg-secondary/60 hover:text-foreground`

const dangerBtn = `${baseBtn} border border-destructive/25 bg-destructive/8 px-5 py-2.5 text-destructive/80 hover:border-destructive/45 hover:bg-destructive/15 hover:text-destructive`

export function TimerControls({ onStart, onPause, onResume, onStop }: TimerControlsProps) {
  const status = useTimerStore((s) => s.status)

  if (status === 'idle') {
    return (
      <button onClick={onStart} className={primaryBtn}>
        <Play className="h-3.5 w-3.5 fill-current" />
        Start Session
      </button>
    )
  }

  if (status === 'running') {
    return (
      <div className="flex items-center gap-2.5">
        <button onClick={onPause} className={outlineBtn}>
          <Pause className="h-3.5 w-3.5 fill-current" />
          Pause
        </button>
        <button onClick={onStop} className={dangerBtn}>
          <Square className="h-3.5 w-3.5 fill-current" />
          Stop
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2.5">
      <button onClick={onResume} className={primaryBtn}>
        <Play className="h-3.5 w-3.5 fill-current" />
        Resume
      </button>
      <button onClick={onStop} className={dangerBtn}>
        <Square className="h-3.5 w-3.5 fill-current" />
        Stop
      </button>
    </div>
  )
}
