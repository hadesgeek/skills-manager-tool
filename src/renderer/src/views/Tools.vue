<template>
  <div class="tools-page">
    <header class="content-header">
      <h1 class="content-title">工具</h1>
      <div class="header-actions">
        <button class="action-btn" @click="refreshTools">
          <span class="icon">↻</span>
          <span class="text">刷新</span>
        </button>
        <button class="primary-btn" @click="showAddToolModal = true">
          <span class="icon">+</span>
          <span class="text">添加自定义工具</span>
        </button>
      </div>
    </header>

    <div class="tools-content">
      <!-- 标签筛选 -->
      <div class="filter-tabs">
        <button 
          class="tab-btn" 
          :class="{ active: currentTab === '全部' }"
          @click="currentTab = '全部'"
        >
          全部
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: currentTab === '已安装' }"
          @click="currentTab = '已安装'"
        >
          已安装
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: currentTab === '未安装' }"
          @click="currentTab = '未安装'"
        >
          未安装
        </button>
      </div>

      <div class="tools-list">
        <div 
          v-for="tool in filteredTools" 
          :key="tool.id" 
          class="tool-card"
        >
          <div class="tool-header">
            <div class="tool-icon">
              <img v-if="tool.iconPath" :src="tool.iconPath" :alt="tool.name" class="tool-icon-img" />
              <span v-else>{{ tool.name.charAt(0) }}</span>
            </div>
            <div class="tool-info">
              <div class="tool-header-row">
                <div class="tool-name">{{ tool.name }}</div>
                <span class="tool-status-tag" :class="{ 'status-installed': tool.installed }">
                  {{ tool.installed ? '已检测到' : '未检测到' }}
                </span>
              </div>
              <div class="tool-id">ID: {{ tool.id }}</div>
            </div>
            <div class="tool-actions">
              <div 
                class="toggle-switch" 
                :class="{ active: tool.enabled }"
                @click.stop="toggleTool(tool)"
              >
                <div class="toggle-knob"></div>
              </div>
              <button 
                class="settings-btn" 
                @click.stop="openSkillListModal(tool)"
                title="管理 Skills"
              >
                <span class="icon">⚙</span>
              </button>
            </div>
          </div>
          
          <div class="tool-paths">
            <div class="path-row">
              <span class="path-label">配置路径</span>
              <span class="path-value">{{ tool.configPath || '未检测到' }}</span>
              <button class="copy-btn" @click.stop="copyPath(tool.configPath)">📋</button>
            </div>
            <div class="path-row">
              <span class="path-label">Skills 路径</span>
              <span class="path-value">{{ tool.skillsPath || '未检测到' }}</span>
              <button class="copy-btn" @click.stop="copyPath(tool.skillsPath)">📋</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加自定义工具弹窗 -->
    <Modal v-model="showAddToolModal" width="600px">
      <div class="modal-header">
        <h2 class="modal-title">新建自定义工具配置</h2>
        <p class="modal-subtitle">添加用于 Skill 的本地工具调用</p>
      </div>
      <div class="modal-body">
         <div class="form-group">
          <label>工具名称</label>
          <input type="text" placeholder="输入名称" class="form-input" />
        </div>
        <div class="form-group">
          <label>执行路径 (Path)</label>
          <input type="text" placeholder="/usr/bin/python3 等" class="form-input" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn cancel-btn" @click="showAddToolModal = false">取消</button>
        <button class="btn primary-btn" @click="showAddToolModal = false">保存设置</button>
      </div>
    </Modal>

    <!-- Skills 列表弹窗 -->
    <Modal v-model="showSkillListModal" width="800px" resizable>
      <div class="skills-modal-header">
        <div class="modal-header-left">
          <div class="tool-icon-small">
            <img v-if="currentTool?.iconPath" :src="currentTool.iconPath" :alt="currentTool.name" />
          </div>
          <div class="modal-header-info">
            <h3 class="modal-tool-name">{{ currentTool?.name }}</h3>
            <p class="modal-tool-subtitle">管理 Skills 配置</p>
          </div>
        </div>
        <div class="modal-header-actions">
          <button 
            class="mode-toggle-btn" 
            :class="{ active: isMultiSelectMode }"
            @click="toggleMultiSelectMode"
          >
            {{ isMultiSelectMode ? '退出多选' : '多选模式' }}
          </button>
          <button class="close-btn" @click="showSkillListModal = false">
            <span>×</span>
          </button>
        </div>
      </div>
      
      <!-- 多选模式工具栏 -->
      <div v-if="isMultiSelectMode" class="multi-select-toolbar">
        <button class="toolbar-btn" @click="toggleSelectAll">
          {{ selectedSkills.size === currentToolSkills.length ? '取消全选' : '全选' }}
        </button>
        <div class="toolbar-divider"></div>
        <button 
          class="toolbar-btn" 
          :disabled="selectedSkills.size === 0"
          @click="batchEnableSelected"
        >
          启用选中 ({{ selectedSkills.size }})
        </button>
        <button 
          class="toolbar-btn" 
          :disabled="selectedSkills.size === 0"
          @click="batchDisableSelected"
        >
          禁用选中 ({{ selectedSkills.size }})
        </button>
      </div>
      
      <div class="skills-modal-body">
        <div v-if="currentToolSkills.length === 0" class="empty-skills-state">
          <div class="empty-icon">📦</div>
          <p class="empty-text">暂无可用的 Skills</p>
          <p class="empty-hint">请先在本地创建 Skill 文件</p>
        </div>
        
        <div v-else class="skills-grid">
          <div 
            v-for="skill in currentToolSkills" 
            :key="skill.name" 
            class="skill-card"
            :class="{ 
              'skill-active': skill.active,
              'skill-selected': isMultiSelectMode && selectedSkills.has(skill.name)
            }"
            @click="isMultiSelectMode && toggleSkillSelection(skill.name)"
          >
            <!-- 多选模式的复选框 -->
            <div v-if="isMultiSelectMode" class="skill-checkbox">
              <input 
                type="checkbox" 
                :checked="selectedSkills.has(skill.name)"
                @click.stop="toggleSkillSelection(skill.name)"
              />
            </div>
            
            <!-- Skill 信息 -->
            <div class="skill-info">
              <div class="skill-name" :title="skill.name">{{ skill.name }}</div>
              <div class="skill-desc" :title="skill.desc || '无描述'">{{ skill.desc || '无描述' }}</div>
            </div>
            
            <!-- 开关（非多选模式） -->
            <div v-if="!isMultiSelectMode" class="skill-toggle">
              <label class="toggle-switch">
                <input 
                  type="checkbox" 
                  :checked="skill.active"
                  @change="toggleSkill(skill)"
                />
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div class="skills-modal-footer">
        <div class="footer-info">
          <span class="info-text">共 {{ currentToolSkills.length }} 个 Skills</span>
          <span class="info-text">已启用 {{ currentToolSkills.filter((s: Skill) => s.active).length }} 个</span>
        </div>
        <button class="primary-btn" @click="showSkillListModal = false">完成</button>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Modal from '../components/common/Modal.vue'
import toolsConfigData from '../config/tools-config.json'
import { getToolIconPath } from '../config/tool-icons-map'

// 工具接口定义
interface Tool {
  id: string
  name: string
  dirName: string
  installed: boolean  // 是否检测到工具目录（已安装）
  enabled: boolean    // 用户是否开启了工具（开关状态）
  configPath: string
  skillsPath: string
  iconPath?: string
}

// Skill 接口定义
interface Skill {
  name: string
  desc: string    // Skill 描述
  active: boolean // 是否启用
  selected?: boolean // 是否被选中（多选模式）
}

// 响应式数据
const toolsData = ref<Tool[]>([])
const currentTab = ref('全部')
const showAddToolModal = ref(false)
const showSkillListModal = ref(false)
const currentTool = ref<Tool | null>(null)
const currentToolSkills = ref<Skill[]>([])
const skillsPath = ref('E:\\AITools\\SKillsManager\\Skills') // TODO: 从设置中读取
const isMultiSelectMode = ref(false) // 是否多选模式
const selectedSkills = ref<Set<string>>(new Set()) // 选中的 Skills

// 将工具名称转换为 ID
const nameToId = (name: string): string => {
  return name.toLowerCase().replace(/\s+/g, '-')
}

// 加载工具列表
const loadTools = async () => {
  try {
    console.log('[Tools] 开始加载工具列表...')
    
    // 1. 从配置文件加载工具基础信息
    toolsData.value = toolsConfigData.map(tool => ({
      id: nameToId(tool.name),
      name: tool.name,
      dirName: tool.dirName,
      installed: false,
      enabled: false,
      configPath: '',
      skillsPath: '',
      iconPath: getToolIconPath(nameToId(tool.name))
    }))
    
    // 2. 从持久化存储加载工具状态（包括 installed、路径、enabled）
    // @ts-ignore
    const toolsState = await window.api.getToolsState()
    console.log('[Tools] 加载的工具状态:', toolsState)
    
    // 3. 检查是否需要初始化检测（第一次启动或配置为空）
    let needsInitialCheck = false
    
    // 4. 合并状态到工具列表
    toolsData.value.forEach(tool => {
      const savedState = toolsState.tools[tool.id]
      if (savedState) {
        tool.enabled = savedState.enabled || false
        tool.installed = savedState.installed || false
        tool.configPath = savedState.configPath || ''
        tool.skillsPath = savedState.skillsPath || ''
        console.log(`[Tools] ${tool.name} - 启用: ${tool.enabled}, 安装: ${tool.installed}`)
      } else {
        // 配置中没有这个工具的信息，需要检测
        needsInitialCheck = true
      }
    })
    
    // 5. 如果需要初始化检测，执行一次检测
    if (needsInitialCheck) {
      console.log('[Tools] 检测到首次启动或配置不完整，执行初始化检测...')
      await checkToolsInstallation()
    }
    
    console.log('[Tools] 工具列表加载完成')
  } catch (error) {
    console.error('[Tools] 加载工具列表失败:', error)
  }
}

// 检查工具安装状态（只更新 installed 和路径，不更新 enabled 状态）
const checkToolsInstallation = async () => {
  try {
    console.log('[Tools] 开始检测工具安装状态...')
    
    const results = await window.api.checkToolsInstallation(
      toolsConfigData.map(t => ({ name: t.name, dirName: t.dirName }))
    )
    
    // 更新工具列表的安装状态
    results.forEach(result => {
      const tool = toolsData.value.find(t => t.id === result.id)
      if (tool) {
        tool.installed = result.installed
        tool.configPath = result.configPath
        tool.skillsPath = result.skillsPath
      }
    })
    
    // 保存安装状态到持久化存储
    for (const result of results) {
      // @ts-ignore
      await window.api.updateToolInstallation(
        result.id,
        result.installed,
        result.configPath,
        result.skillsPath
      )
    }
    
    console.log('[Tools] 工具安装状态检测完成')
  } catch (error) {
    console.error('[Tools] 检查工具安装状态失败:', error)
  }
}

// 筛选后的工具列表
const filteredTools = computed(() => {
  if (currentTab.value === '全部') {
    return toolsData.value
  } else if (currentTab.value === '已安装') {
    return toolsData.value.filter(t => t.installed)
  } else {
    return toolsData.value.filter(t => !t.installed)
  }
})

// 刷新工具列表
const refreshTools = async () => {
  console.log('[Tools] 刷新工具列表...')
  // 重新检测安装状态
  await checkToolsInstallation()
  console.log('[Tools] 工具列表已刷新')
}

// 切换工具开关
const toggleTool = async (tool: Tool) => {
  const newState = !tool.enabled
  
  try {
    console.log(`[Tools] 切换工具 ${tool.name} 状态: ${tool.enabled} -> ${newState}`)
    
    // 更新持久化存储
    // @ts-ignore
    const success = await window.api.updateToolEnabled(tool.id, newState)
    
    if (success) {
      tool.enabled = newState
      console.log(`[Tools] 工具 ${tool.name} ${newState ? '已开启' : '已关闭'}`)
      
      // 如果是开启工具，检查是否需要打开 Skills 选择弹窗
      if (newState) {
        // @ts-ignore
        const toolConfig = await window.api.getStorageToolConfig(tool.id)
        const hasSkills = toolConfig && toolConfig.enabledSkills && Object.keys(toolConfig.enabledSkills).length > 0
        
        if (!hasSkills) {
          // 第一次开启，打开 Skills 列表让用户选择
          await openSkillListModal(tool)
        }
      }
    } else {
      console.error(`[Tools] 更新工具 ${tool.name} 状态失败`)
    }
  } catch (error) {
    console.error(`[Tools] 切换工具 ${tool.name} 失败:`, error)
  }
}

// 打开 Skills 列表弹窗
const openSkillListModal = async (tool: Tool) => {
  currentTool.value = tool
  await loadToolSkills(tool)
  showSkillListModal.value = true
}

// 加载工具的 Skills 列表
const loadToolSkills = async (tool: Tool) => {
  try {
    console.log(`[Tools] 加载 ${tool.name} 的 Skills...`)
    
    // 1. 从文件系统获取 Skills 列表
    const skills = await window.api.getToolSkills(tool.id, skillsPath.value)
    
    // 2. 从持久化存储获取启用状态
    // @ts-ignore
    const toolConfig = await window.api.getStorageToolConfig(tool.id)
    const enabledSkills = toolConfig?.enabledSkills || {}
    
    // 3. 合并状态
    currentToolSkills.value = skills.map(skill => ({
      ...skill,
      active: enabledSkills[skill.name] || false
    }))
    
    console.log(`[Tools] 加载 ${tool.name} 的 Skills 完成: ${skills.length} 个`)
    console.log('[Tools] Skills 启用状态:', enabledSkills)
  } catch (error) {
    console.error('[Tools] 加载 Skills 失败:', error)
    currentToolSkills.value = []
  }
}

// 切换 Skill 开关
const toggleSkill = async (skill: Skill) => {
  const newState = !skill.active
  
  if (!currentTool.value) return
  
  try {
    console.log(`[Tools] 切换 Skill ${skill.name} 状态: ${skill.active} -> ${newState}`)
    
    // 更新持久化存储
    // @ts-ignore
    const success = await window.api.updateToolSkills(
      currentTool.value.id,
      skill.name,
      newState
    )
    
    if (success) {
      skill.active = newState
      console.log(`[Tools] Skill ${skill.name} ${newState ? '已启用' : '已禁用'}`)
    } else {
      console.error(`[Tools] 更新 Skill ${skill.name} 状态失败`)
    }
  } catch (error) {
    console.error(`[Tools] 切换 Skill ${skill.name} 失败:`, error)
  }
}

// 切换多选模式
const toggleMultiSelectMode = () => {
  isMultiSelectMode.value = !isMultiSelectMode.value
  if (!isMultiSelectMode.value) {
    selectedSkills.value.clear()
  }
}

// 切换 Skill 选中状态
const toggleSkillSelection = (skillName: string) => {
  if (selectedSkills.value.has(skillName)) {
    selectedSkills.value.delete(skillName)
  } else {
    selectedSkills.value.add(skillName)
  }
}

// 全选/取消全选
const toggleSelectAll = () => {
  if (selectedSkills.value.size === currentToolSkills.value.length) {
    selectedSkills.value.clear()
  } else {
    currentToolSkills.value.forEach(skill => {
      selectedSkills.value.add(skill.name)
    })
  }
}

// 批量启用选中的 Skills
const batchEnableSelected = async () => {
  if (!currentTool.value || selectedSkills.value.size === 0) return
  
  console.log(`[Tools] 批量启用 ${selectedSkills.value.size} 个 Skills`)
  
  for (const skillName of selectedSkills.value) {
    const skill = currentToolSkills.value.find(s => s.name === skillName)
    if (skill && !skill.active) {
      // @ts-ignore
      await window.api.updateToolSkills(currentTool.value.id, skillName, true)
      skill.active = true
    }
  }
  
  selectedSkills.value.clear()
  isMultiSelectMode.value = false
  console.log('[Tools] 批量启用完成')
}

// 批量禁用选中的 Skills
const batchDisableSelected = async () => {
  if (!currentTool.value || selectedSkills.value.size === 0) return
  
  console.log(`[Tools] 批量禁用 ${selectedSkills.value.size} 个 Skills`)
  
  for (const skillName of selectedSkills.value) {
    const skill = currentToolSkills.value.find(s => s.name === skillName)
    if (skill && skill.active) {
      // @ts-ignore
      await window.api.updateToolSkills(currentTool.value.id, skillName, false)
      skill.active = false
    }
  }
  
  selectedSkills.value.clear()
  isMultiSelectMode.value = false
  console.log('[Tools] 批量禁用完成')
}

// 复制路径到剪贴板
const copyPath = (path: string) => {
  if (!path) return
  navigator.clipboard.writeText(path)
  console.log('路径已复制:', path)
}

// 获取图标背景色
const getIconBgColor = (id: string): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
  ]
  const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[index % colors.length]
}

// 组件挂载时加载工具列表
onMounted(() => {
  loadTools()
})
</script>

<style scoped>
.tools-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.content-header {
  padding: 2rem 2rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.primary-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: white;
  border: none;
  border-radius: 8px;
  color: #667eea;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.tools-content {
  flex: 1;
  background: #f5f7fa;
  border-radius: 24px 24px 0 0;
  padding: 1.5rem 2rem;
  overflow-y: auto;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.tab-btn {
  padding: 0.5rem 1.25rem;
  background: white;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  color: #657786;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.tab-btn.active {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.tools-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 1rem;
}

.tool-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
}

.tool-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.tool-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.tool-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
  overflow: hidden;
  background: #f0f0f0;
}

.tool-icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tool-info {
  flex: 1;
  min-width: 0;
}

.tool-header-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.tool-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #14171a;
}

.tool-status-tag {
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  background: #e1e8ed;
  color: #657786;
}

.tool-status-tag.status-installed {
  background: #d4edda;
  color: #155724;
}

.tool-id {
  font-size: 0.75rem;
  color: #657786;
}

.tool-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toggle-switch {
  width: 48px;
  height: 28px;
  background: #e1e8ed;
  border-radius: 14px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s;
}

.toggle-switch.active {
  background: #47d7ac;
}

.toggle-knob {
  width: 22px;
  height: 22px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 3px;
  left: 3px;
  transition: transform 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-switch.active .toggle-knob {
  transform: translateX(20px);
}

.settings-btn {
  width: 36px;
  height: 36px;
  background: #f5f7fa;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.125rem;
}

.settings-btn:hover {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.tool-paths {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.path-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.path-label {
  color: #657786;
  font-weight: 500;
  min-width: 80px;
}

.path-value {
  flex: 1;
  color: #14171a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-btn {
  padding: 0.25rem 0.5rem;
  background: #f5f7fa;
  border: 1px solid #e1e8ed;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e1e8ed;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #14171a;
  margin: 0 0 0.5rem 0;
}

.modal-subtitle {
  font-size: 0.875rem;
  color: #657786;
  margin: 0;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #14171a;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e1e8ed;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn {
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: white;
  border: 1px solid #e1e8ed;
  color: #657786;
}

.cancel-btn:hover {
  background: #f5f7fa;
}
</style>

<style>
/* Skills 弹窗样式（非 scoped，用于 Teleport） */
.skills-modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e1e8ed;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.modal-header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.modal-header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.mode-toggle-btn {
  padding: 0.5rem 1rem;
  background: #f5f7fa;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #657786;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-toggle-btn:hover {
  background: #e1e8ed;
}

.mode-toggle-btn.active {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.tool-icon-small {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-icon-small img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modal-header-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.modal-tool-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #14171a;
  margin: 0;
}

.modal-tool-subtitle {
  font-size: 0.875rem;
  color: #657786;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  background: #f5f7fa;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.5rem;
  color: #657786;
}

.close-btn:hover {
  background: #e1e8ed;
}

/* 多选工具栏 */
.multi-select-toolbar {
  padding: 1rem 1.5rem;
  background: #f5f7fa;
  border-bottom: 1px solid #e1e8ed;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toolbar-btn {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #e1e8ed;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #14171a;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover:not(:disabled) {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #e1e8ed;
}

.skills-modal-body {
  padding: 1.5rem;
  max-height: 500px;
  overflow-y: auto;
}

.empty-skills-state {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-text {
  font-size: 1rem;
  font-weight: 500;
  color: #14171a;
  margin: 0 0 0.5rem 0;
}

.empty-hint {
  font-size: 0.875rem;
  color: #657786;
  margin: 0;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 0.75rem;
}

.skill-card {
  background: #f5f7fa;
  border: 2px solid #e1e8ed;
  border-radius: 12px;
  padding: 1rem;
  transition: all 0.2s;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  min-height: 80px;
  max-height: 100px;
}

.skill-card:hover {
  border-color: #667eea;
}

.skill-card.skill-active {
  background: #e8f0fe;
  border-color: #667eea;
}

.skill-card.skill-selected {
  background: #fff3cd;
  border-color: #ffc107;
}

.skill-checkbox {
  flex-shrink: 0;
  padding-top: 0.125rem;
}

.skill-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.skill-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  overflow: hidden;
}

.skill-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #14171a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

.skill-desc {
  font-size: 0.75rem;
  color: #657786;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}

.skill-toggle {
  flex-shrink: 0;
  padding-top: 0.125rem;
}

/* Toggle Switch */
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
  background-color: #e1e8ed;
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input:checked + .slider {
  background-color: #47d7ac;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.skills-modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e1e8ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-info {
  display: flex;
  gap: 1rem;
}

.info-text {
  font-size: 0.875rem;
  color: #657786;
}
</style>
