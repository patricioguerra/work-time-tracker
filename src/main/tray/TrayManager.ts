import { Tray, Menu, nativeImage, app } from 'electron'
import { deflateSync } from 'zlib'
import type { TimerState } from '@shared/types'
import type { TimerService } from '../timer/TimerService'
import { formatDuration } from '../../shared/utils/time'

// CRC32 table used for PNG chunk checksums
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[i] = c
  }
  return t
})()

function crc32(data: Buffer): number {
  let c = 0xffffffff
  for (const b of data) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function makeColorIcon(r: number, g: number, b: number, size = 16): Electron.NativeImage {
  // Build raw PNG scanlines: filter_byte(0) + r + g + b per pixel, per row
  const rowLen = 1 + size * 3
  const raw = Buffer.alloc(size * rowLen)
  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0
    for (let x = 0; x < size; x++) {
      raw[y * rowLen + 1 + x * 3] = r
      raw[y * rowLen + 1 + x * 3 + 1] = g
      raw[y * rowLen + 1 + x * 3 + 2] = b
    }
  }
  const compressed = deflateSync(raw)

  // IHDR
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(size, 0)
  ihdrData.writeUInt32BE(size, 4)
  ihdrData[8] = 8; ihdrData[9] = 2 // 8-bit RGB
  const ihdrType = Buffer.from('IHDR')
  const ihdrChunk = Buffer.alloc(25)
  ihdrChunk.writeUInt32BE(13, 0)
  ihdrType.copy(ihdrChunk, 4)
  ihdrData.copy(ihdrChunk, 8)
  ihdrChunk.writeUInt32BE(crc32(Buffer.concat([ihdrType, ihdrData])), 21)

  // IDAT
  const idatType = Buffer.from('IDAT')
  const idatChunk = Buffer.alloc(4 + 4 + compressed.length + 4)
  idatChunk.writeUInt32BE(compressed.length, 0)
  idatType.copy(idatChunk, 4)
  compressed.copy(idatChunk, 8)
  idatChunk.writeUInt32BE(crc32(Buffer.concat([idatType, compressed])), 8 + compressed.length)

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), // PNG signature
    ihdrChunk,
    idatChunk,
    Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]) // IEND
  ])

  return nativeImage.createFromBuffer(png)
}

const ICONS = {
  idle: makeColorIcon(150, 150, 150),    // gray
  running: makeColorIcon(34, 197, 94),   // green
  paused: makeColorIcon(249, 115, 22)    // orange
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
