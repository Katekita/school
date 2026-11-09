import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === 'true' ? '/school/' : '/',
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    // Карта Leaflet нужна только на /dariek. Без этой функции Vite
    // предзагружал бы 152 КБ тайл-движка на каждой странице.
    modulePreload: {
      resolveDependency: (dep) => (dep.includes('leaflet') ? undefined : dep),
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('leaflet')) return 'vendor-leaflet'
          if (id.includes('motion') || id.includes('framer')) return 'vendor-motion'
          if (id.includes('react-router') || id.includes('@remix-run')) return 'vendor-router'
          return 'vendor'
        },
      },
    },
  },
})
