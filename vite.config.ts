import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const HOST = env.VITE_DEV_HOST || '127.0.0.1'
  const PORT = Number(env.VITE_DEV_PORT || 5173)

  return {
    plugins: [react()],
    server: {
      host: HOST,          // 👈 serve on 127.0.0.1
      port: PORT,
      strictPort: true,
      hmr: { 
        host: HOST,        // 👈 ensure HMR WS also uses 127.0.0.1 (not localhost)
        protocol: 'ws',
        port: PORT,
      },
    },
    preview: {
      host: HOST,
      port: 4173,
      strictPort: true,
    },
  }
})
