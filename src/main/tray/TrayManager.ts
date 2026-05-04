import { Tray, Menu, app } from 'electron'
import type { TimerState } from '@shared/types'
import type { TimerService } from '../timer/TimerService'
import { formatDuration } from '../../shared/utils/time'
import { makeCircleIcon } from '../utils/icon'

export class TrayManager {
  private tray: Tray
  private tickInterval: NodeJS.Timeout | null = null
  private readonly icons = {
    idle:    makeCircleIcon(150, 150, 150),
    running: makeCircleIcon(34, 197, 94),
    paused:  makeCircleIcon(249, 115, 22)
  }

  constructor(private timer: TimerService, private openWindow: () => void) {
    this.tray = new Tray(this.icons.idle)
    this.tray.setToolTip('Work Time Tracker')
    this.tray.on('click', () => this.openWindow())
    this.timer.addListener((state) => this.onStateChange(state))
    const initial = this.timer.getState()
    this.rebuildDisplay(initial)
    this.rebuildMenu(initial)
  }

  private onStateChange(state: TimerState): void {
    this.rebuildDisplay(state)
    this.rebuildMenu(state)

    if (state.status === 'running') {
      if (!this.tickInterval) {
        this.tickInterval = setInterval(() => {
          this.rebuildDisplay(this.timer.getState())
        }, 1000)
      }
    } else {
      if (this.tickInterval) {
        clearInterval(this.tickInterval)
        this.tickInterval = null
      }
    }
  }

  private rebuildDisplay(state: TimerState): void {
    this.tray.setImage(this.icons[state.status])
    if (state.status === 'idle') {
      this.tray.setTitle('')
      this.tray.setToolTip('Work Time Tracker')
    } else {
      this.tray.setTitle(formatDuration(state.elapsedActive))
      const label = state.status === 'running' ? 'Running' : 'Paused'
      this.tray.setToolTip(`${label} — ${formatDuration(state.elapsedActive)}`)
    }
  }

  private rebuildMenu(state: TimerState): void {
    const statusLabel =
      state.status === 'idle' ? 'Work Time Tracker'
      : state.status === 'running' ? 'Running'
      : 'Paused'

    const menu = Menu.buildFromTemplate([
      { label: statusLabel, enabled: false },
      { type: 'separator' },
      { label: 'Open', click: () => this.openWindow() },
      { type: 'separator' },
      { label: 'Start',  enabled: state.status === 'idle',    click: () => this.timer.start() },
      { label: 'Pause',  enabled: state.status === 'running', click: () => this.timer.pause() },
      { label: 'Resume', enabled: state.status === 'paused',  click: () => this.timer.resume() },
      { label: 'Stop…',  enabled: state.status !== 'idle',    click: () => this.openWindow() },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() }
    ])
    this.tray.setContextMenu(menu)
  }

  destroy(): void {
    if (this.tickInterval) clearInterval(this.tickInterval)
    this.tray.destroy()
  }
}
