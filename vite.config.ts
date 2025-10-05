import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import checker from 'vite-plugin-checker'

export default defineConfig({
  plugins: [mdx(), react()],
  server: { port: 5173 },
  build: { sourcemap: true },
})
