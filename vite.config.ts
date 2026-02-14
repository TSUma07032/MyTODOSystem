import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // 更新があったら即反映
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'], // キャッシュする静的ファイル
      manifest: {
        name: 'My Ultimate Todo',    // フル名称
        short_name: 'MyTodo',        // アイコンの下に出る名前
        description: '世界で一番使いやすい俺専用TODO',
        theme_color: '#ffffff',      // ステータスバーの色
        background_color: '#ffffff', // 起動時の背景色
        display: 'standalone',       // ★これが重要！ブラウザのUIを消す設定
        start_url: '/',
        icons: [
          {
            src: 'icon-192x192.png', // ※あとで用意する画像ファイル名
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})