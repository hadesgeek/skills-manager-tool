import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'
import path from 'path'

// 项目根目录
const projectRoot = resolve(__dirname)

/**
 * 自定义 vite 插件：构建完成后将 vditor dist 复制到 renderer 输出目录
 * 供 Vditor.preview 运行时动态加载资源
 */
function copyVditorPlugin() {
  return {
    name: 'copy-vditor-dist',
    closeBundle() {
      const src = path.join(projectRoot, 'node_modules/vditor/dist')
      const dest = path.join(projectRoot, 'out/renderer/vditor/dist')
      copyDirSync(src, dest)
      console.log('[copy-vditor] vditor dist 已复制到 out/renderer/vditor/dist')
    }
  }
}

function copyDirSync(src: string, dest: string) {
  if (!fs.existsSync(src)) return
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

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
    plugins: [
      vue(),
      copyVditorPlugin()
    ],
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
