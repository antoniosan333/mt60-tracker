import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use relative asset paths so the build works on any static host at root
  base: './',
  server: {
    host: true,
    port: 43123,
    strictPort: true,
  },
  preview: {
    port: 43124,
    strictPort: true,
  },
})
