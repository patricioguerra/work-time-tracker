import { deflateSync } from 'zlib'
import { nativeImage } from 'electron'

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

function chunk(type: string, data: Buffer): Buffer {
  const typeBytes = Buffer.from(type)
  const out = Buffer.alloc(4 + 4 + data.length + 4)
  out.writeUInt32BE(data.length, 0)
  typeBytes.copy(out, 4)
  data.copy(out, 8)
  out.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 8 + data.length)
  return out
}

export function makeCircleIcon(r: number, g: number, b: number, size = 16): Electron.NativeImage {
  const cx = (size - 1) / 2
  const cy = (size - 1) / 2
  const radius = size / 2 - 0.5

  const rowLen = 1 + size * 4
  const raw = Buffer.alloc(size * rowLen, 0)

  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0
    for (let x = 0; x < size; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      const alpha =
        dist <= radius - 0.5 ? 255
        : dist <= radius + 0.5 ? Math.round(255 * (radius + 0.5 - dist))
        : 0
      const i = y * rowLen + 1 + x * 4
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; raw[i + 3] = alpha
    }
  }

  const ihdr = Buffer.alloc(13, 0)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 6   // color type: RGBA

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ])

  return nativeImage.createFromBuffer(png)
}
