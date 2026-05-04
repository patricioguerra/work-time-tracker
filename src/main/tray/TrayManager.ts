import { Tray, Menu, app } from 'electron'
import type { TimerState } from '@shared/types'
import type { TimerService } from '../timer/TimerService'
import { formatDuration } from '../../shared/utils/time'
import { makeCircleIcon } from '../utils/icon'

const ICONS = {
  idle:    makeCircleIcon(150, 150, 150),
  running: makeCircleIcon(34, 197, 94),
  paused:  makeCircleIcon(249, 115, 22)
}

export class TrayManager {
  private tray: Tray
  private tickInterval: NodeJS.Timeout | null = null

  constructor(private timer: TimerService, private openWindow: () => void) {
    this.tray = new Tray(ICONS.idle)
    this.tray.setToolTip('Work Time Tracker')
    this.timer.addListener((state) => this.onStateChange(state))
    this.rebuild(this.timer.getState())
  }

  private onStateChange(state: TimerState): void {
    this.rebuild(state)

    if (state.status === 'running') {
      if (!this.tickInterval) {
        this.tickInterval = setInterval(() => {
          const current = this.timer.getState()
          this.tray.setToolTip(`Running — ${formatDuration(current.elapsedActive)}`)
        }, 1000)
      }
    } else {
      if (this.tickInterval) {
        clearInterval(this.tickInterval)
        this.tickInterval = null
      }
    }
  }

  private rebuild(state: TimerState): void {
    this.tray.setImage(ICONS[state.status])

    const tooltip =
      state.status === 'idle'
        ? 'Work Time Tracker'
        : state.status === 'running'
        ? `Running — ${formatDuration(state.elapsedActive)}`
        : `Paused — ${formatDuration(state.elapsedActive)}`
    this.tray.setToolTip(tooltip)

    const menu = Menu.buildFromTemplate([
      {
        label: 'Start',
        enabled: state.status === 'idle',
        click: () => this.timer.start()
      },
      {
        label: 'Pause',
        enabled: state.status === 'running',
        click: () => this.timer.pause()
      },
      {
        label: 'Resume',
        enabled: state.status === 'paused',
        click: () => this.timer.resume()
      },
      {
        label: 'Stop…',
        enabled: state.status !== 'idle',
        click: () => {
          this.openWindow()
          // User must complete the stop dialog in the renderer
        }
      },
      { type: 'separator' },
      { label: 'Open Window', click: () => this.openWindow() },
      { label: 'Quit', click: () => app.quit() }
    ])
    this.tray.setContextMenu(menu)
  }

  destroy(): void {
    if (this.tickInterval) clearInterval(this.tickInterval)
    this.tray.destroy()
  }
}
