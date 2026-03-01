<template>
  <header class="title-bar">
    <div class="title-left">
      <!-- 占位模拟标题区 -->
      <span class="app-title">Skills Manager Tool</span>
    </div>
    
    <div class="title-right">
      <button class="win-btn win-min" title="Minimize" @click="minimizeApp">
        <svg viewBox="0 0 10 1" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 0H10V1H0V0Z" fill="currentColor"/></svg>
      </button>
      <button class="win-btn win-max" title="Maximize" @click="maximizeApp">
        <svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 0H10V10H0V0ZM1 1V9H9V1H1Z" fill="currentColor"/></svg>
      </button>
      <button class="win-btn win-close" title="Close" @click="closeApp">
        <svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.707106 0L0 0.707107L4.29289 5L0 9.29289L0.707106 10L5 5.70711L9.29289 10L10 9.29289L5.70711 5L10 0.707107L9.29289 0L5 4.29289L0.707106 0Z" fill="currentColor"/></svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
const minimizeApp = () => {
  if (window.api) {
    window.api.windowMin()
  }
}

const maximizeApp = () => {
  if (window.api) {
    window.api.windowMax()
  }
}

const closeApp = () => {
  if (window.api) {
    window.api.windowClose()
  } else if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.send('window-close')
  } else {
    console.log('Close app clicked')
  }
}
</script>

<style scoped>
.title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  background-color: var(--titlebar-bg-color);
  padding: 0;
  border-bottom: 1px solid var(--border-color);
  
  /* 让整个标题栏可拖拽 */
  -webkit-app-region: drag;
}

.title-left {
  display: flex;
  align-items: center;
  padding-left: 16px;
  gap: 8px;
}

.app-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.title-right {
  display: flex;
  align-items: stretch;
  height: 100%;
  
  /* 使得控制按钮不可拖拽，以响应点击事件 */
  -webkit-app-region: no-drag;
}

.win-btn {
  width: 46px;
  height: 100%;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  color: #111;
}

.win-btn svg {
  width: 10px;
  height: 10px;
}

.win-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.win-close:hover {
  background-color: #e81123;
  color: white;
}
</style>
