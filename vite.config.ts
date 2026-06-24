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
        name: 'Image Resizer & Enhancer',
        short_name: 'ImageResizer',
        description: 'Secure, offline-first image cropping and enhancement app.',
        theme_color: '#E86A33',
        background_color: '#F0F4F8',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
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
