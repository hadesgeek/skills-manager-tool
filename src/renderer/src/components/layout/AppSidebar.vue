<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <img :src="logoIcon" alt="Skills Manager" class="sidebar-logo" />
      <a>Skills Manager Tool</a>
    </div>

    <nav class="nav-menu">
      <router-link to="/skills-manager" class="nav-item">
        <span class="nav-icon active-icon">✦</span>
        <span class="nav-label">Skills</span>
      </router-link>
      <router-link to="/tools" class="nav-item">
        <span class="nav-icon">⚙</span>
        <span class="nav-label">工具</span>
      </router-link>
      <router-link to="/market" class="nav-item">
        <span class="nav-icon">◈</span>
        <span class="nav-label">市场</span>
      </router-link>
      <router-link to="/settings" class="nav-item">
        <span class="nav-icon">◎</span>
        <span class="nav-label">设置</span>
      </router-link>
      <a href="#" class="nav-item">
        <span class="nav-icon">☆</span>
        <span class="nav-label">反馈</span>
      </a>
    </nav>

    <div class="sidebar-spacer"></div>

    <!-- <div class="user-section">
      <div class="user-avatar"></div>
      <span class="user-name">Personal</span>
    </div> -->
  </aside>
</template>

<script setup lang="ts">
// 导入 logo 图片
import logoIcon from '../../assets/icon.png'
</script>

<style scoped>
.sidebar {
  width: 214px;
  background-color: #F8F9FA;
  border-right: 1px solid #E5E7EB;
  display: flex;
  flex-direction: column;
  padding: 16px 0;
}

.sidebar-header {
  height: 40px;
  padding: 0 16px;
  display: flex;
  align-items: center;
}

.sidebar-logo {
  height: 32px;
  width: auto;
  object-fit: contain;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 8px 0 8px;
}

.nav-item {
  height: 36px;
  border-radius: 6px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
  text-decoration: none;
}

.nav-icon {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #6B7280;
  width: 16px;
  text-align: center;
}

.nav-label {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #6B7280;
}

.nav-item:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.nav-item.router-link-active {
  background-color: #EEF2FF;
}

.nav-item.router-link-active .nav-icon {
  color: #6366F1;
}

.nav-item.router-link-active .nav-label {
  color: #6366F1;
  font-weight: 500;
}

.sidebar-spacer {
  flex: 1;
}

.user-section {
  height: 48px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-top: 1px solid #E5E7EB;
  margin-top: 16px;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 14px;
  background-color: #E5E7EB;
}

.user-name {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 400;
  color: #374151;
}
</style>
