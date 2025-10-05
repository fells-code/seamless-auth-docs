import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'

export default defineConfig({
  plugins: [mdx(), react()],
  server: { port: 5173 },
  build: { sourcemap: true },
})
