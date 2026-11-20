import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  /* the "last updated" fallback when GitHub cannot be reached */
  define: { __BUILD_TIME__: JSON.stringify(new Date().toISOString()) },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5175 },
  preview: { port: 5175 },
})
