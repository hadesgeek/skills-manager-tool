<template>
  <div class="settings-page">
    <header class="content-header">
      <h1 class="content-title">设置</h1>
      <button class="save-btn" @click="saveSettings">保存设置</button>
    </header>

    <div class="scroll-area">
      <!-- 通用 -->
      <section class="settings-section">
        <h2 class="section-title">通用</h2>
        <div class="settings-card">
          
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-name">Skills 存储目录</span>
              <span class="setting-desc">所有 Skills 的存储位置</span>
            </div>
            <div class="setting-action">
              <span class="path-text">E:\AI\Skills\SkillManager\...</span>
              <button class="action-btn">更改</button>
            </div>
          </div>
          
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-name">默认编辑器</span>
              <span class="setting-desc">用于打开 Skill 文件的编辑器</span>
            </div>
            <div class="setting-action">
              <div class="dropdown-btn">
                <span class="icon">📝</span>
                <span class="text">Built-in Editor</span>
                <span class="arrow">▼</span>
              </div>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-name">自动同步</span>
              <span class="setting-desc">编辑 Skill 后自动同步到已使用的工具</span>
            </div>
            <div class="setting-action">
              <label class="toggle-switch">
                <input type="checkbox" checked />
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div class="setting-row no-border">
            <div class="setting-info">
              <span class="setting-name">同步通知</span>
              <span class="setting-desc">同步完成后显示通知提示</span>
            </div>
            <div class="setting-action">
              <label class="toggle-switch">
                <input type="checkbox" checked />
                <span class="slider"></span>
              </label>
            </div>
          </div>

        </div>
      </section>

      <!-- AI 配置 -->
      <section class="settings-section">
        <h2 class="section-title">AI 配置</h2>
        <div class="settings-card">
          <div class="setting-row no-border">
            <div class="setting-info flex-column">
              <span class="setting-name">Gemini API Key</span>
              <span class="setting-desc">用于自动化翻译 Skill Markdown 到中文</span>
            </div>
            <div class="setting-action flex-row flex-1">
              <input type="text" v-model="geminiApiKey" class="form-input flex-1" placeholder="输入 Gemini API Key" />
            </div>
          </div>
        </div>
      </section>

      <!-- 市场1 -->
      <section class="settings-section">
        <h2 class="section-title">市场</h2>
        <div class="settings-card">
          <div class="setting-row no-border">
            <div class="setting-info flex-column">
              <span class="setting-name">GitHub Token</span>
              <span class="setting-desc">可选: 提高 GitHub API 限额，避免频繁访问失败</span>
            </div>
            <div class="setting-action flex-row">
              <span class="placeholder-text">输入你的 GitHub Personal Access Token</span>
              <button class="action-btn">添加</button>
            </div>
          </div>
        </div>
      </section>

      <!-- 市场2 -->
      <section class="settings-section">
        <h2 class="section-title">市场</h2>
        <div class="settings-card">
          <div class="setting-row">
            <div class="setting-info flex-column">
              <span class="setting-name">GitHub Token</span>
              <span class="setting-desc">可选: 提高 GitHub API 限额，避免频繁访问失败</span>
            </div>
            <div class="setting-action flex-row">
              <span class="placeholder-text">输入你的 GitHub Personal Access Token</span>
              <button class="action-btn">添加</button>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-info flex-column">
              <span class="setting-name">awesome-claude-skills</span>
              <span class="setting-desc">第三方 API - https://github.com/ComposioHQ/awesome-claude-skills</span>
            </div>
            <div class="setting-action">
               <label class="toggle-switch">
                <input type="checkbox" checked />
                <span class="slider"></span>
              </label>
            </div>
          </div>

           <div class="setting-row no-border">
            <div class="setting-info flex-column">
              <span class="setting-name">skills.sh</span>
              <span class="setting-desc">第三方 API - https://skills.sh</span>
            </div>
            <div class="setting-action">
               <label class="toggle-switch">
                <input type="checkbox" checked />
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>
      </section>

      <!-- 外观 -->
      <section class="settings-section">
        <h2 class="section-title">外观</h2>
        <div class="settings-card">
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-name">主题</span>
              <span class="setting-desc">选择浅色、深色或跟随系统</span>
            </div>
            <div class="setting-action">
              <div class="button-group">
                <button class="btn-group-item">
                  <span class="icon">☀️</span>
                  浅色
                </button>
                <button class="btn-group-item">
                  <span class="icon">🌙</span>
                  深色
                </button>
                <button class="btn-group-item active-outline">
                  <span class="icon">💻</span>
                  跟随系统
                </button>
              </div>
            </div>
          </div>

          <div class="setting-row no-border">
            <div class="setting-info">
              <span class="setting-name">界面语言</span>
              <span class="setting-desc">设置应用显示的语言</span>
            </div>
            <div class="setting-action">
              <div class="button-group">
                 <button class="btn-group-item outline">English</button>
                 <button class="btn-group-item solid-dark">中文</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 关于 -->
      <section class="settings-section">
        <h2 class="section-title">关于</h2>
        <div class="settings-card about-card">
          <div class="app-info">
            <span class="app-name">Skills Manager</span>
            <span class="app-desc">统一管理多 AI 工具的 Skills</span>
          </div>
          <div class="version-row">
            <span class="version-text">v1.1.4</span>
            <button class="action-btn">检查更新</button>
          </div>
          <a href="#" class="privacy-link">隐私政策</a>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const geminiApiKey = ref('')

function saveSettings() {
  localStorage.setItem('GEMINI_API_KEY', geminiApiKey.value)
  console.log('[Settings] Saved API Key:', geminiApiKey.value ? `${geminiApiKey.value.substring(0, 10)}...` : 'EMPTY')
  alert('设置已保存')
}

onMounted(() => {
  const savedKey = localStorage.getItem('GEMINI_API_KEY')
  console.log('[Settings] Loading saved API Key:', savedKey ? `${savedKey.substring(0, 10)}...` : 'NOT FOUND')
  if (savedKey) {
    geminiApiKey.value = savedKey
  } else {
    // 默认提供给开发或测试使用的 key
    geminiApiKey.value = 'AIzaSyCHLSIgw32GieV6CdttdyIrZKaZGvsl0YU'
    localStorage.setItem('GEMINI_API_KEY', geminiApiKey.value)
    console.log('[Settings] Set default API Key:', geminiApiKey.value.substring(0, 10) + '...')
  }
})
</script>

<style scoped>
/* 全局充沛充满，并处理字体 */
.settings-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #FFFFFF;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* 顶部 Header */
.content-header {
  height: 64px;
  flex-shrink: 0;
  padding: 0 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content-title {
  font-size: 24px;
  font-weight: 700;
  color: #1F2937;
  margin: 0;
}

.save-btn {
  height: 36px;
  padding: 0 16px;
  background-color: #1F2937;
  color: #FFFFFF;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
}

.save-btn:hover {
  background-color: #374151;
}

/* 滚动区域 */
.scroll-area {
  flex: 1;
  padding: 0 32px 32px 32px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* 章节头部 */
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
  margin: 0;
}

/* 设置卡片容器 */
.settings-card {
  background-color: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

/* 行样式 */
.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #E5E7EB;
  min-height: 72px;
  box-sizing: border-box;
}

.setting-row.no-border {
  border-bottom: none;
}

/* 左侧信息区 */
.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-name {
  font-size: 14px;
  font-weight: 500;
  color: #1F2937;
}

.setting-desc {
  font-size: 12px;
  font-weight: 400;
  color: #6B7280;
}

/* 可选：覆盖布局，对于更宽的左侧 */
.flex-column {
  width: 400px; /* 原型指定的固定宽度 */
}
.flex-row {
  gap: 8px;
}

/* 右侧行为区 */
.setting-action {
  display: flex;
  align-items: center;
  gap: 8px;
}

.path-text {
  font-size: 12px;
  color: #6B7280;
  width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.placeholder-text {
  font-size: 12px;
  color: #9CA3AF;
  width: 200px;
}

.action-btn {
  padding: 6px 12px;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  background: transparent;
  color: #1F2937;
  font-size: 12px;
  cursor: pointer;
}

.action-btn:hover {
  background-color: #F9FAFB;
}

.form-input {
  height: 36px;
  border-radius: 6px;
  border: 1px solid #E5E7EB;
  padding: 0 12px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  outline: none;
}

.form-input:focus {
  border-color: #6366F1;
}

.flex-1 {
  flex: 1;
  width: 100%;
}

/* 伪下拉按钮 */
.dropdown-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background-color: #F3F4F6;
  border-radius: 6px;
  cursor: pointer;
}

.dropdown-btn .text {
  font-size: 12px;
  color: #1F2937;
}

.dropdown-btn .icon {
  font-size: 14px;
}

.dropdown-btn .arrow {
  font-size: 10px;
  color: #6B7280;
}

/* Toggle Switch (对应原型的 44x24 药丸) */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #E5E7EB;
  border-radius: 12px;
  transition: 0.3s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  border-radius: 10px;
  transition: 0.3s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

input:checked + .slider {
  background-color: #6366F1;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

/* 按钮组 */
.button-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-group-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  background: #FFFFFF;
  color: #6B7280;
  font-size: 12px;
  cursor: pointer;
}

.btn-group-item:hover {
  background: #F9FAFB;
}

.btn-group-item .icon {
  font-size: 14px;
}

/* 外观主题特定的默认选中状态 (例如：跟随系统有个框/被选中) */
.btn-group-item.active-outline {
  border-color: #E5E7EB;
}

.btn-group-item.outline {
  color: #6B7280;
}

.btn-group-item.solid-dark {
  background: #1F2937;
  color: #FFFFFF;
  border: none;
  font-weight: 500;
}

/* 关于卡片特定 */
.about-card {
  padding: 20px;
  gap: 16px;
  border: 1px solid #E5E7EB;
}

.app-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.app-name {
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
}

.app-desc {
  font-size: 13px;
  font-weight: 400;
  color: #6B7280;
}

.version-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version-text {
  font-size: 13px;
  color: #6B7280;
}

.privacy-link {
  font-size: 13px;
  color: #3B82F6;
  text-decoration: none;
}

.privacy-link:hover {
  text-decoration: underline;
}
</style>
