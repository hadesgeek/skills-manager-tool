import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [vue()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // 将 vditor 及其依赖打包到单独的 chunk
            if (id.includes('node_modules/vditor')) {
              return 'vditor'
            }
            // 其他模块使用默认分割策略
            return undefined
          }
        }
      },
      // 确保 vditor 不被优化掉
      commonjsOptions: {
        include: [/vditor/, /node_modules/]
      }
    },
    optimizeDeps: {
      // 预构建 vditor
      include: ['vditor']
    }
  }
})
