import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const appEntry = path.resolve(__dirname, 'app.html')

/** GitHub Pages serves this repo from branch root; reserved /docs path breaks on project pages. Static app under /web/. */
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
  // Strip key when publishing static web/ (CI or explicit env). Local `npm run build` alone keeps .env.
  const stripOpenRouterKeyFromBundle =
    process.env.GITHUB_ACTIONS === 'true' || process.env.STRIP_OPENROUTER_KEY === '1'

  return {
    // Never bake repo secrets into static files uploaded from CI (push protection).
    define: isBuild && stripOpenRouterKeyFromBundle
      ? { 'import.meta.env.VITE_OPENROUTER_API_KEY': JSON.stringify('') }
      : {},
    base: isBuild ? '/aiMuseum/web/' : '/',
    plugins: [react(), devAppEntry()],
    build: {
      rollupOptions: {
        input: appEntry,
      },
      outDir: 'dist',
    },
  }
})
