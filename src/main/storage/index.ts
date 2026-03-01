import { app } from 'electron'
import fs from 'fs'
import path from 'path'

// 数据目录路径
const DATA_DIR = path.join(app.getPath('userData'), 'data')

// 配置文件路径
const APP_SETTINGS_FILE = path.join(DATA_DIR, 'app-settings.json')
const TOOLS_STATE_FILE = path.join(DATA_DIR, 'tools-state.json')

// 默认配置
const DEFAULT_APP_SETTINGS = {
  version: '1.0.0',
  general: {
    skillsDirectory: 'E:\\AITools\\SKillsManager\\Skills',
    defaultEditor: 'built-in',
    autoSync: true,
    syncNotification: true
  },
  ai: {
    geminiApiKey: ''
  },
  market: {
    githubToken: '',
    enabledSources: {
      'awesome-claude-skills': true,
      'skills-sh': true
    }
  },
  appearance: {
    theme: 'system',
    language: 'zh-CN'
  }
}

const DEFAULT_TOOLS_STATE = {
  version: '1.0.0',
  tools: {},
  customTools: []
}

/**
 * 确保数据目录存在
 */
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    console.log('[Storage] 创建数据目录:', DATA_DIR)
  }
}

/**
 * 读取 JSON 文件
 */
function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`[Storage] 文件不存在，使用默认值: ${filePath}`)
      return defaultValue
    }
    
    const content = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(content)
    console.log(`[Storage] 读取文件成功: ${filePath}`)
    return data
  } catch (error) {
    console.error(`[Storage] 读取文件失败: ${filePath}`, error)
    return defaultValue
  }
}

/**
 * 写入 JSON 文件
 */
function writeJsonFile(filePath: string, data: any): boolean {
  try {
    ensureDataDir()
    const content = JSON.stringify(data, null, 2)
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`[Storage] 写入文件成功: ${filePath}`)
    return true
  } catch (error) {
    console.error(`[Storage] 写入文件失败: ${filePath}`, error)
    return false
  }
}

/**
 * 获取应用设置
 */
export function getAppSettings(): any {
  return readJsonFile(APP_SETTINGS_FILE, DEFAULT_APP_SETTINGS)
}

/**
 * 保存应用设置
 */
export function saveAppSettings(settings: any): boolean {
  return writeJsonFile(APP_SETTINGS_FILE, settings)
}

/**
 * 获取工具状态
 */
export function getToolsState(): any {
  return readJsonFile(TOOLS_STATE_FILE, DEFAULT_TOOLS_STATE)
}

/**
 * 保存工具状态
 */
export function saveToolsState(state: any): boolean {
  return writeJsonFile(TOOLS_STATE_FILE, state)
}

/**
 * 获取单个工具的配置
 */
export function getToolConfig(toolId: string): any {
  const toolsState = getToolsState()
  return toolsState.tools[toolId] || null
}

/**
 * 保存单个工具的配置
 */
export function saveToolConfig(toolId: string, config: any): boolean {
  const toolsState = getToolsState()
  toolsState.tools[toolId] = config
  return saveToolsState(toolsState)
}

/**
 * 更新工具的启用状态
 */
export function updateToolEnabled(toolId: string, enabled: boolean): boolean {
  const toolsState = getToolsState()
  if (!toolsState.tools[toolId]) {
    toolsState.tools[toolId] = {
      enabled,
      installed: false,
      configPath: '',
      skillsPath: '',
      enabledSkills: {}
    }
  } else {
    toolsState.tools[toolId].enabled = enabled
  }
  return saveToolsState(toolsState)
}

/**
 * 更新工具的 Skills 启用状态
 */
export function updateToolSkills(toolId: string, skillId: string, enabled: boolean): boolean {
  const toolsState = getToolsState()
  if (!toolsState.tools[toolId]) {
    toolsState.tools[toolId] = {
      enabled: false,
      installed: false,
      configPath: '',
      skillsPath: '',
      enabledSkills: {}
    }
  }
  
  if (!toolsState.tools[toolId].enabledSkills) {
    toolsState.tools[toolId].enabledSkills = {}
  }
  
  toolsState.tools[toolId].enabledSkills[skillId] = enabled
  return saveToolsState(toolsState)
}

/**
 * 更新工具的安装状态和路径
 */
export function updateToolInstallation(toolId: string, installed: boolean, configPath: string, skillsPath: string): boolean {
  const toolsState = getToolsState()
  if (!toolsState.tools[toolId]) {
    toolsState.tools[toolId] = {
      enabled: false,
      installed: false,
      configPath: '',
      skillsPath: '',
      enabledSkills: {}
    }
  }
  
  toolsState.tools[toolId].installed = installed
  toolsState.tools[toolId].configPath = configPath
  toolsState.tools[toolId].skillsPath = skillsPath
  
  return saveToolsState(toolsState)
}

/**
 * 初始化存储（应用启动时调用）
 */
export function initStorage(): void {
  console.log('[Storage] 初始化存储系统')
  ensureDataDir()
  
  // 确保配置文件存在
  if (!fs.existsSync(APP_SETTINGS_FILE)) {
    writeJsonFile(APP_SETTINGS_FILE, DEFAULT_APP_SETTINGS)
  }
  
  if (!fs.existsSync(TOOLS_STATE_FILE)) {
    writeJsonFile(TOOLS_STATE_FILE, DEFAULT_TOOLS_STATE)
  }
  
  console.log('[Storage] 存储系统初始化完成')
  console.log('[Storage] 数据目录:', DATA_DIR)
}
