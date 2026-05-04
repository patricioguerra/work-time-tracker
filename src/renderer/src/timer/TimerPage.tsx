import { useState } from 'react'
import { TimerDisplay } from './TimerDisplay'
import { TimerControls } from './TimerControls'
import { StopDialog } from './StopDialog'
import { useTimer } from './useTimer'
import { useHistoryStore } from '@renderer/history/historyStore'

export function TimerPage() {
  const [stopDialogOpen, setStopDialogOpen] = useState(false)
  const { start, pause, resume, stop } = useTimer()
  const reloadHistory = useHistoryStore((s) => s.reload)

  const handleStop = () => setStopDialogOpen(true)

  const handleConfirmStop = async (summary: string) => {
    setStopDialogOpen(false)
    await stop(summary)
    await reloadHistory()
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10">
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
