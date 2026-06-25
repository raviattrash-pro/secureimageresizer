import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      workbox: {
        maximumFileSizeToCacheInBytes: 40000000
      },
      manifest: {
        id: '/',
        start_url: '/',
        scope: '/',
        name: 'Image Resizer & Enhancer',
        short_name: 'ImageResizer',
        description: 'Secure, offline-first image cropping and enhancement app.',
        theme_color: '#E86A33',
        background_color: '#F0F4F8',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  optimizeDeps: {
    exclude: ['@imgly/background-removal']
  },
  resolve: {
    alias: {
      'onnxruntime-web/webgpu': 'onnxruntime-web'
    }
  }
})
