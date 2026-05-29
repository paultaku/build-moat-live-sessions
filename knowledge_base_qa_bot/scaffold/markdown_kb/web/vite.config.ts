import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const backend = 'http://localhost:8000'

// Proxy API calls to the FastAPI backend so the browser talks to a single origin.
// This also makes SSE on /chat/stream work without CORS preflight quirks.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/health': { target: backend, changeOrigin: true },
      '/index': { target: backend, changeOrigin: true },
      '/chat': { target: backend, changeOrigin: true },
    },
  },
})
