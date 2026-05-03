import { useState } from 'react'
import { TimerDisplay } from './TimerDisplay'
import { TimerControls } from './TimerControls'
import { StopDialog } from './StopDialog'
import { useTimer } from './useTimer'

export function TimerPage() {
  const [stopDialogOpen, setStopDialogOpen] = useState(false)
  const { start, pause, resume, stop } = useTimer()

  const handleStop = () => setStopDialogOpen(true)

  const handleConfirmStop = async (summary: string) => {
    setStopDialogOpen(false)
    await stop(summary)
  }

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-16">
      <TimerDisplay />
      <TimerControls
        onStart={start}
        onPause={pause}
        onResume={resume}
        onStop={handleStop}
      />
      <StopDialog
        open={stopDialogOpen}
        onConfirm={handleConfirmStop}
        onCancel={() => setStopDialogOpen(false)}
      />
    </div>
  )
}
