<template>
  <div class="app-layout">
    <AppTitleBar />
    <div class="app-body">
      <AppSidebar v-if="!$route.meta.hideSidebar" />
      <main class="app-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import AppTitleBar from './components/layout/AppTitleBar.vue'
import AppSidebar from './components/layout/AppSidebar.vue'
import { logger } from './utils/logger'

onMounted(() => {
  logger.info('[App] 应用已挂载')
  
  // 检查 Vditor 是否可用
  setTimeout(() => {
    // @ts-ignore
    const vditorAvailable = typeof Vditor !== 'undefined'
    // @ts-ignore
    const vditorPreviewAvailable = vditorAvailable && typeof Vditor.preview === 'function'
    
    logger.info('[App] Vditor 可用性检查', {
      vditorDefined: vditorAvailable,
      vditorPreviewExists: vditorPreviewAvailable,
      // @ts-ignore
      vditorVersion: vditorAvailable ? (Vditor.version || 'unknown') : 'N/A'
    })
    
    if (!vditorAvailable) {
      logger.error('[App] Vditor 未加载！这将导致 Markdown 渲染失败')
    }
  }, 1000)
})
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.app-content {
  flex: 1;
  background-color: var(--app-bg-color);
  overflow-y: auto;
  position: relative;
}
</style>
