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
      manifest: false,
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
