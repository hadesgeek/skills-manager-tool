<template>
  <div class="log-viewer">
    <div class="log-header">
      <h3>应用日志</h3>
      <div class="log-actions">
        <button @click="refreshLogs" class="btn-refresh" :disabled="loading">
          {{ loading ? '加载中...' : '刷新' }}
        </button>
        <button @click="clearLogs" class="btn-clear">清空日志</button>
        <button @click="openLogDir" class="btn-open">打开日志目录</button>
      </div>
    </div>
    
    <div class="log-info">
      <p>日志文件路径: <code>{{ logPath }}</code></p>
    </div>
    
    <div class="log-content" ref="logContainer">
      <pre v-if="logs">{{ logs }}</pre>
      <div v-else class="no-logs">暂无日志</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const logs = ref<string>('')
const logPath = ref<string>('')
const loading = ref(false)
const logContainer = ref<HTMLElement | null>(null)

// 刷新日志
async function refreshLogs() {
  loading.value = true
  try {
    logs.value = await window.api.readLogs()
    // 滚动到底部
    setTimeout(() => {
      if (logContainer.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight
      }
    }, 100)
  } catch (error) {
    console.error('读取日志失败:', error)
  } finally {
    loading.value = false
  }
}

// 清空日志
async function clearLogs() {
  if (!confirm('确定要清空所有日志吗？')) {
    return
  }
  
  try {
    await window.api.clearLogs()
    logs.value = ''
    alert('日志已清空')
  } catch (error) {
    console.error('清空日志失败:', error)
    alert('清空日志失败')
  }
}

// 打开日志目录
async function openLogDir() {
  try {
    const logDir = await window.api.getLogDir()
    // 使用 shell 打开目录
    window.electron.ipcRenderer.send('open-external', logDir)
  } catch (error) {
    console.error('打开日志目录失败:', error)
  }
}

// 组件挂载时加载日志
onMounted(async () => {
  try {
    logPath.value = await window.api.getLogPath()
    await refreshLogs()
  } catch (error) {
    console.error('初始化日志查看器失败:', error)
  }
})
</script>

<style scoped>
.log-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-background);
  border-radius: 8px;
  overflow: hidden;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
}

.log-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-heading);
}

.log-actions {
  display: flex;
  gap: 8px;
}

.log-actions button {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.log-actions button:hover:not(:disabled) {
  background: var(--color-background-soft);
  border-color: var(--color-border-hover);
}

.log-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-clear {
  color: #f56c6c;
}

.btn-clear:hover:not(:disabled) {
  background: #fef0f0;
  border-color: #f56c6c;
}

.log-info {
  padding: 12px 20px;
  background: var(--color-background-mute);
  border-bottom: 1px solid var(--color-border);
}

.log-info p {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.log-info code {
  padding: 2px 6px;
  background: var(--color-background);
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
}

.log-content {
  flex: 1;
  overflow: auto;
  padding: 16px 20px;
  background: var(--color-background);
}

.log-content pre {
  margin: 0;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-text);
  white-space: pre-wrap;
  word-wrap: break-word;
}

.no-logs {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-secondary);
  font-size: 14px;
}
</style>
