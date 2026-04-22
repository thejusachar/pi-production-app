import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // needed inside Docker
    port: 5173,
    proxy: {
      // Forward /api requests to the backend during development
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
    },
  },
})
