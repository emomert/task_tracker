import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    // The BlockNote editor is intentionally lazy-loaded into its own chunk.
    chunkSizeWarningLimit: 1100,
  },
})
