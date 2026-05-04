const { deflateSync } = require('zlib')
const { writeFileSync, mkdirSync } = require('fs')
const { join } = require('path')

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[i] = c
  }
  return t
})()

function crc32(data) {
  let c = 0xffffffff
  for (const b of data) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function makeChunk(type, data) {
  const typeBytes = Buffer.from(type)
  const out = Buffer.alloc(4 + 4 + data.length + 4)
  out.writeUInt32BE(data.length, 0)
  typeBytes.copy(out, 4)
  data.copy(out, 8)
  out.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 8 + data.length)
  return out
}

function makeCirclePNG(r, g, b, size) {
  const cx = (size - 1) / 2
  const cy = (size - 1) / 2
  const radius = size / 2 - 0.5

  const rowLen = 1 + size * 4
  const raw = Buffer.alloc(size * rowLen, 0)

  for (let y = 0; y < size; y++) {
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
  ihdr[8] = 8
  ihdr[9] = 6  // RGBA

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', deflateSync(raw)),
    makeChunk('IEND', Buffer.alloc(0))
  ])
}

const SIZES = [16, 32, 48, 64, 128, 256, 512]
const iconsDir = join(__dirname, '..', 'build', 'icons')
mkdirSync(iconsDir, { recursive: true })

for (const size of SIZES) {
  const buf = makeCirclePNG(34, 197, 94, size)  // #22c55e green
  writeFileSync(join(iconsDir, `${size}x${size}.png`), buf)
  console.log(`  ✓ ${size}x${size}.png`)
}
console.log('Done → build/icons/')
