import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const appEntry = path.resolve(__dirname, 'app.html')

/** GitHub serves this repo from main branch root; production static files live under /docs/. */
function devAppEntry() {
  return {
    name: 'dev-app-entry',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const raw = req.url || ''
        const [pathname, ...restQ] = raw.split('?')
        const q = restQ.length ? `?${restQ.join('?')}` : ''
        if (pathname === '/' || pathname === '/index.html') {
          req.url = `/app.html${q}`
        }
        next()
      })
    },
  }
}

export default defineConfig(({ command }) => {
  const isBuild = command === 'build'

  return {
    // Never bake local .env secrets into vite build output: docs/ is committed to git and
    // GitHub Push Protection rejects OpenRouter-shaped strings in blobs.
    define: isBuild
      ? { 'import.meta.env.VITE_OPENROUTER_API_KEY': JSON.stringify('') }
      : {},
    base: isBuild ? '/aiMuseum/docs/' : '/',
    plugins: [react(), devAppEntry()],
    build: {
      rollupOptions: {
        input: appEntry,
      },
      outDir: 'dist',
    },
  }
})
