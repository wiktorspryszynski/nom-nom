import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'NomNom',
        short_name: 'NomNom',
        description: 'Meal planning and diet tracking',
        theme_color: '#FDC535',
        background_color: '#FDC535',
        display: 'standalone',
        icons: [
          { src: '/nomnom-icon-bg.png', sizes: '192x192', type: 'image/png' },
          { src: '/nomnom-icon-bg.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
      },
    },
  },
})
