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
import AppTitleBar from './components/layout/AppTitleBar.vue'
import AppSidebar from './components/layout/AppSidebar.vue'
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
