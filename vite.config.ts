import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          // 保持已动态 import 的重型库独立分包，不被合并回主包
          if (id.includes('html2canvas') || id.includes('/docx/')) return
          if (id.includes('reka-ui')) return 'vendor-reka'
          if (id.includes('vuedraggable') || id.includes('sortablejs')) return 'vendor-drag'
          if (id.includes('lucide-vue-next')) return 'vendor-icons'
          return 'vendor'
        },
      },
    },
  },
})
