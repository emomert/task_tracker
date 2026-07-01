import { defineConfig } from 'vitest/config'

// Standalone Vitest config (kept separate from vite.config so tests don't pull in
// the React plugin). Pure-logic tests run in the fast Node environment.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
