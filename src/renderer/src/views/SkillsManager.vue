<template>
  <div class="skills-page">
    <header class="content-header">
      <h1 class="content-title">Skills</h1>
      <div class="header-actions">
        <button class="action-btn" @click="fetchSkills">
          <span class="icon">↻</span>
          <span class="text">刷新</span>
        </button>
        <div class="search-box">
          <input 
            type="text" 
            placeholder="搜索 Skills" 
            v-model="searchQuery"
            @keydown="handleSearch"
          />
          <button 
            v-if="searchQuery" 
            class="clear-search-btn" 
            @click="clearSearch"
            title="清空搜索"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <!-- <button class="primary-btn" @click="showModal = true">
          <span class="icon">+</span>
          <span class="text">新建 Skill</span>
        </button> -->
      </div>
    </header>

    <div class="skills-content">
      <p class="count-label">
        {{ searchQuery ? `找到 ${filteredSkills.length} 个匹配的 Skills` : `已管理 ${skills.length}个Skill` }}
      </p>

      <div v-if="loading" class="loading-state">
        <p>正在加载技能...</p>
      </div>
      <div v-else-if="filteredSkills.length === 0 && searchQuery" class="empty-state">
        <p>未找到匹配 "{{ searchQuery }}" 的 Skills</p>
        <button class="btn cancel-btn" @click="clearSearch">清空搜索</button>
      </div>
      <div v-else-if="skills.length === 0" class="empty-state">
        <p>当前目录 ({{ skillsPath }}) 下没有发现技能，请点击右上方按钮新建。</p>
      </div>

      <div v-else class="skills-list">
        <div 
          v-for="skill in filteredSkills" 
          :key="skill.id" 
          class="skill-card" 
          @click="onCardClick(skill, $event)"
        >
          <div class="skill-card-top">
            <div class="skill-card-left">
              <div 
                class="avator-mock" 
                :class="{ 'loading-icon': skill.generatingIcon }"
                @mousedown="onIconMouseDown(skill, $event)"
                @mouseup="onIconMouseUp($event)"
                @mouseleave="onIconMouseLeave($event)"
                @click.stop.prevent
                :title="skill.generatingIcon ? '生成中...' : '长按重新生成图标'"
              >
                <img v-if="skill.icon" :src="skill.icon" :alt="skill.name" class="skill-icon-img" />
                <span v-else>{{ skill.name.charAt(0).toUpperCase() }}</span>
              </div>
              <div class="skill-info">
                <div class="skill-name">
                  {{ skill.name }}
                  <span class="status-dot" :class="{ 'status-active': skill.isActive }"></span>
                  <span v-if="skill.translating" class="translating-badge">翻译中...</span>
                </div>
                <div class="skill-desc" :class="{ 'loading-text': skill.translating }" :title="skill.desc">
                  {{ skill.desc }}
                </div>
              </div>
            </div>
            <!-- <button class="delete-btn" title="删除" @click.stop>✕</button> -->
          </div>

          <!-- <div class="skill-card-bottom">
             <span class="skill-tools">适用于 未与任何工具关联</span> 
             <button class="edit-btn" @click.stop="goToEditor(skill)">编辑</button>
          </div> --> 
        </div>
      </div>
    </div>

    <!-- 弹窗部分骨架先放在这里 -->
    <Modal v-model="showModal" width="480px">
      <div class="modal-header">
        <h2 class="modal-title">新建 Skill</h2>
        <p class="modal-subtitle">创建一个新的 Skill 文件夹</p>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>名称</label>
          <input type="text" placeholder="输入 Skill 名称" class="form-input" />
        </div>
        <div class="form-group">
          <label>描述</label>
          <textarea placeholder="输入 Skill 描述 (可选)" class="form-input textarea" rows="3"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn cancel-btn" @click="showModal = false">取消</button>
        <button class="btn primary-btn" @click="showModal = false">创建</button>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Modal from '../components/common/Modal.vue'

const router = useRouter()

interface Skill {
  id: string
  name: string
  desc: string
  path: string
  icon?: string
  translating?: boolean  // 是否正在翻译
  generatingIcon?: boolean  // 是否正在生成图标
  isActive?: boolean  // 是否被某个已启用的工具使用
  needsTranslation?: boolean  // 是否需要翻译（后端返回）
}

const showModal = ref(false)

const skills = ref<Skill[]>([])
const loading = ref(false)
const skillsPath = ref('E:\\AITools\\SKillsManager\\Skills') // TODO: Read from settings later
const searchQuery = ref('') // 搜索关键词

// 长按相关状态
const longPressTimer = ref<number | null>(null)
const isLongPressing = ref(false)
const longPressSkill = ref<Skill | null>(null)

// 过滤后的 Skills 列表
const filteredSkills = computed(() => {
  if (!searchQuery.value.trim()) {
    return skills.value
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  return skills.value.filter(skill => 
    skill.name.toLowerCase().includes(query)
  )
})

/**
 * 快速加载 Skills（不等待翻译）
 */
async function fetchSkills() {
  loading.value = true
  try {
    console.log('[SkillsManager] 快速加载 Skills...')
    
    // 1. 快速加载基本信息（使用缓存的翻译和图标）
    // @ts-ignore
    const fastSkills = await window.api.getSkillsFast(skillsPath.value)
    skills.value = fastSkills.map(skill => ({
      ...skill,
      translating: false,
      generatingIcon: false,
      isActive: false
    }))
    
    console.log(`[SkillsManager] 快速加载完成，共 ${skills.value.length} 个 Skills`)
    
    // 2. 检查 Skills 的激活状态
    await checkSkillsActiveStatus()
    
    // 3. 异步处理需要翻译和生成图标的 Skills
    // @ts-ignore
    const settings = await window.api.getAppSettings()
    const apiKey = settings?.ai?.geminiApiKey || ''
    if (apiKey) {
      processSkillsAsync(apiKey)
    } else {
      console.log('[SkillsManager] 未配置 API Key，跳过翻译和图标生成')
    }
  } catch (error) {
    console.error('[SkillsManager] 加载 Skills 失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 检查 Skills 的激活状态
 * 如果某个 Skill 被某个已启用的工具使用，则标记为激活
 */
async function checkSkillsActiveStatus() {
  try {
    console.log('[SkillsManager] 检查 Skills 激活状态...')
    
    // 获取所有工具的状态
    // @ts-ignore
    const toolsState = await window.api.getToolsState()
    
    if (!toolsState || !toolsState.tools) {
      console.log('[SkillsManager] 工具状态为空')
      return
    }
    
    // 遍历每个 Skill，检查是否被某个已启用的工具使用
    for (const skill of skills.value) {
      let isActive = false
      
      // 遍历所有工具
      for (const [toolId, toolState] of Object.entries(toolsState.tools)) {
        const tool = toolState as any
        
        // 检查工具是否启用
        if (!tool.enabled) {
          continue
        }
        
        // 直接使用 toolsState 中的配置，不需要再次调用 API
        const toolConfig = tool
        
        // 检查这个 Skill 是否在工具的启用列表中
        if (toolConfig && toolConfig.enabledSkills && toolConfig.enabledSkills[skill.name]) {
          isActive = true
          console.log(`[SkillsManager] ${skill.name} 被工具 ${toolId} 使用`)
          break
        }
      }
      
      skill.isActive = isActive
    }
    
    console.log('[SkillsManager] Skills 激活状态检查完成')
  } catch (error) {
    console.error('[SkillsManager] 检查 Skills 激活状态失败:', error)
  }
}

/**
 * 异步处理 Skills 的翻译和图标生成
 */
async function processSkillsAsync(apiKey: string) {
  console.log('[SkillsManager] 开始异步处理 Skills...')
  
  for (const skill of skills.value) {
    // 使用后端返回的标志位判断是否需要翻译
    const needsTranslation = skill.needsTranslation === true
    
    // 检查是否需要生成图标
    const needsIcon = !skill.icon
    
    if (needsTranslation) {
      // 翻译描述
      console.log(`[SkillsManager] ${skill.name} 需要翻译`)
      await translateSkill(skill, apiKey)
    }
    
    if (needsIcon) {
      // 生成图标（使用翻译后的描述）
      console.log(`[SkillsManager] ${skill.name} 需要生成图标`)
      await generateIcon(skill, apiKey)
    }
  }
  
  console.log('[SkillsManager] 异步处理完成')
}

/**
 * 翻译单个 Skill 的描述
 */
async function translateSkill(skill: Skill, apiKey: string) {
  try {
    skill.translating = true
    console.log(`[SkillsManager] 翻译 ${skill.name}...`)
    
    // @ts-ignore
    const result = await window.api.translateSkillDesc(skill.path, apiKey)
    
    // 更新描述
    skill.desc = result.desc
    skill.translating = false
    
    console.log(`[SkillsManager] ${skill.name} 翻译完成`)
  } catch (error) {
    console.error(`[SkillsManager] 翻译 ${skill.name} 失败:`, error)
    skill.translating = false
  }
}

/**
 * 生成单个 Skill 的图标
 */
async function generateIcon(skill: Skill, apiKey: string) {
  try {
    skill.generatingIcon = true
    console.log(`[SkillsManager] 生成 ${skill.name} 的图标...`)
    
    // @ts-ignore
    const result = await window.api.generateSkillIcon(skill.name, skill.desc, apiKey)
    
    // 更新图标（后端已保存到文件系统）
    skill.icon = result.icon
    skill.generatingIcon = false
    
    console.log(`[SkillsManager] ${skill.name} 图标生成完成`)
  } catch (error) {
    console.error(`[SkillsManager] 生成 ${skill.name} 图标失败:`, error)
    skill.generatingIcon = false
  }
}

/**
 * 长按开始
 */
function onIconMouseDown(skill: Skill, event: MouseEvent) {
  // 阻止事件冒泡，避免触发卡片点击
  event.stopPropagation()
  event.preventDefault()
  
  if (skill.generatingIcon) {
    return
  }
  
  isLongPressing.value = false
  longPressSkill.value = skill
  
  // 设置长按定时器（500ms）
  longPressTimer.value = window.setTimeout(() => {
    isLongPressing.value = true
    console.log(`[SkillsManager] 长按触发，重新生成 ${skill.name} 的图标`)
    regenerateIcon(skill)
  }, 500)
}

/**
 * 长按结束或取消
 */
function onIconMouseUp(event: MouseEvent) {
  event.stopPropagation()
  event.preventDefault()
  
  // 清除定时器
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
  
  // 延迟重置状态，确保 click 事件能检测到长按状态
  setTimeout(() => {
    isLongPressing.value = false
    longPressSkill.value = null
  }, 50)
}

/**
 * 鼠标离开图标区域
 */
function onIconMouseLeave(event: MouseEvent) {
  event.stopPropagation()
  
  // 清除定时器
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
  
  // 延迟重置状态
  setTimeout(() => {
    isLongPressing.value = false
    longPressSkill.value = null
  }, 50)
}

/**
 * 重新生成图标（长按触发）
 */
async function regenerateIcon(skill: Skill) {
  if (skill.generatingIcon) {
    console.log(`[SkillsManager] ${skill.name} 正在生成中，跳过`)
    return
  }
  
  // @ts-ignore
  const settings = await window.api.getAppSettings()
  const apiKey = settings?.ai?.geminiApiKey || ''
  if (!apiKey) {
    console.log('[SkillsManager] 未配置 API Key，无法重新生成图标')
    return
  }
  
  console.log(`[SkillsManager] 重新生成 ${skill.name} 的图标`)
  await generateIcon(skill, apiKey)
}

/**
 * 卡片点击事件
 */
function onCardClick(skill: Skill, event: MouseEvent) {
  // 如果正在长按或刚刚长按过，不跳转
  if (isLongPressing.value) {
    console.log('[SkillsManager] 长按状态，阻止跳转')
    event.preventDefault()
    event.stopPropagation()
    return
  }
  
  goToEditor(skill)
}

/**
 * 处理搜索（回车键触发）
 */
function handleSearch(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    console.log(`[SkillsManager] 搜索: ${searchQuery.value}`)
    // 搜索逻辑由 computed 自动处理
  }
}

/**
 * 清空搜索
 */
function clearSearch() {
  searchQuery.value = ''
  console.log('[SkillsManager] 清空搜索')
}

function goToEditor(skill: Skill) {
  router.push({ path: '/skill-editor', query: { path: skill.path, name: skill.name } })
}

onMounted(() => {
  fetchSkills()
})
</script>

<style scoped>
.skills-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Header */
.content-header {
  height: 80px;
  padding: 0 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content-title {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 24px;
  color: #1F2937;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.action-btn {
  height: 36px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
  background-color: transparent;
  color: #374151;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
}

.search-box {
  width: 180px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
  padding: 0 12px;
  display: flex;
  align-items: center;
  position: relative;
}

.search-box input {
  border: none;
  outline: none;
  font-size: 13px;
  color: #1F2937;
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.search-box input::placeholder {
  color: #9CA3AF;
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #E5E7EB;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  color: #6B7280;
  transition: all 0.2s;
}

.clear-search-btn:hover {
  background: #D1D5DB;
  color: #374151;
}

.primary-btn {
  height: 36px;
  padding: 0 16px;
  background-color: #1F2937;
  color: #FFFFFF;
  border-radius: 8px;
  font-weight: 500;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  display: flex;
  align-items: center;
  gap: 6px;
}

.primary-btn:hover {
  background-color: #111827;
}

/* Content */
.skills-content {
  flex: 1;
  padding: 0 32px 32px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}

.count-label {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #6B7280;
  margin: 0;
}

.skills-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.loading-state,
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #6B7280;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  background-color: #F9FAFB;
  border-radius: 8px;
  border: 1px dashed #E5E7EB;
}

/* Card */
.skill-card {
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: #FFFFFF;
  transition: box-shadow 0.2s;
  cursor: pointer;
}

.skill-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.skill-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.skill-card-left {
  display: flex;
  gap: 12px;
}

.avator-mock {
  width: 50px;
  height: 50px;
  background-color: #EEF2FF;
  border-radius: 8px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #6366F1;
  overflow: hidden;
  position: relative;
  padding: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.avator-mock:hover {
  background-color: #DDD6FE;
  transform: scale(1.05);
}

.skill-icon-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
}

.loading-icon {
  animation: pulse 1.5s ease-in-out infinite;
  cursor: wait;
}

.loading-icon:hover {
  transform: none;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.skill-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.skill-name {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 6px;
  height: 6px;
  background-color: #9CA3AF;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.status-dot.status-active {
  background-color: #10B981;
}

.skill-desc {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #6B7280;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.loading-text {
  color: #9CA3AF;
  font-style: italic;
}

.translating-badge {
  font-size: 11px;
  color: #6366F1;
  background: #EEF2FF;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.delete-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #9CA3AF;
}

.delete-btn:hover {
  background-color: #FEE2E2;
  color: #EF4444;
}

.skill-card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.skill-tools {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #9CA3AF;
}

.edit-btn {
  height: 28px;
  padding: 0 12px;
  border-radius: 6px;
  border: 1px solid #E5E7EB;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #374151;
}

.edit-btn:hover {
  background-color: #F9FAFB;
}

/* Modal form specifics */
.modal-header {
  padding: 32px 32px 0 32px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-title {
  margin: 0;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 20px;
  color: #1F2937;
}

.modal-subtitle {
  margin: 0;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #6B7280;
}

.modal-body {
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.form-input {
  height: 40px;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
  padding: 0 12px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
}

.form-input.textarea {
  height: auto;
  padding: 12px;
  resize: vertical;
}

.form-input:focus {
  outline: none;
  border-color: #6366F1;
}

.modal-footer {
  padding: 0 32px 32px 32px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn {
  height: 40px;
  padding: 0 20px;
  background-color: #F3F4F6;
  color: #374151;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cancel-btn:hover {
  background-color: #E5E7EB;
}

.modal-footer .primary-btn {
  height: 40px;
  padding: 0 20px;
  font-size: 14px;
}
</style>
