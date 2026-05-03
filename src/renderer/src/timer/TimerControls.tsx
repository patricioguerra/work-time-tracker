import { useTimerStore } from './timerStore'
import { Button } from '@renderer/components/ui/button'

interface TimerControlsProps {
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
}

export function TimerControls({ onStart, onPause, onResume, onStop }: TimerControlsProps) {
  const status = useTimerStore((s) => s.status)

  if (status === 'idle') {
    return (
      <Button size="lg" onClick={onStart} className="w-32">
        Start
      </Button>
    )
  }

  if (status === 'running') {
    return (
      <div className="flex gap-3">
        <Button variant="outline" size="lg" onClick={onPause} className="w-32">
          Pause
        </Button>
        <Button variant="destructive" size="lg" onClick={onStop} className="w-32">
          Stop
        </Button>
      </div>
    )
  }

  // paused
  return (
    <div className="flex gap-3">
      <Button size="lg" onClick={onResume} className="w-32">
        Resume
      </Button>
      <Button variant="destructive" size="lg" onClick={onStop} className="w-32">
        Stop
      </Button>
    </div>
  )
}
