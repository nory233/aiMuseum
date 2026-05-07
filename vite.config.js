import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages project URL: https://USER.github.io/REPO/ — base must match repo name.
export default defineConfig({
  base: '/aiMuseum/',
  plugins: [react()],
})
