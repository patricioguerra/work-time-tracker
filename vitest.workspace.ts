import { defineWorkspace } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineWorkspace([
  {
    test: {
      name: 'main',
      include: ['src/main/**/*.test.ts', 'src/shared/**/*.test.ts'],
      environment: 'node',
      alias: { '@shared': resolve(__dirname, 'src/shared') }
    }
  },
  {
    plugins: [react()],
    test: {
      name: 'renderer',
      include: ['src/renderer/src/**/*.test.{ts,tsx}'],
      environment: 'jsdom',
      setupFiles: ['./src/renderer/src/test-setup.ts'],
      alias: {
        '@renderer': resolve(__dirname, 'src/renderer/src'),
        '@shared': resolve(__dirname, 'src/shared')
      }
    }
  }
])
