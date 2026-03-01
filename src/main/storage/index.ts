import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { logger } from '../logger'

// 数据目录路径
const DATA_DIR = path.join(app.getPath('userData'), 'data')

// 配置文件路径
const APP_SETTINGS_FILE = path.join(DATA_DIR, 'app-settings.json')
const TOOLS_STATE_FILE = path.join(DATA_DIR, 'tools-state.json')

// 内存缓存
let appSettingsCache: any = null
let toolsStateCache: any = null
let cacheTimestamp = {
  appSettings: 0,
  toolsState: 0
}

// 默认配置
const DEFAULT_APP_SETTINGS = {
  version: '1.0.0',
  general: {
    skillsDirectory: '', // 用户必须在设置中配置
    defaultEditor: 'vditor',
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
    logger.info('[Storage] 创建数据目录:', DATA_DIR)
  }
}

/**
 * 读取 JSON 文件（带缓存）
 */
function readJsonFile<T>(filePath: string, defaultValue: T, useCache: boolean = true): T {
  try {
    if (!fs.existsSync(filePath)) {
      logger.info(`[Storage] 文件不存在，使用默认值: ${filePath}`)
      return defaultValue
    }
    
    // 如果使用缓存，检查缓存是否有效
    if (useCache) {
      const stats = fs.statSync(filePath)
      const fileModTime = stats.mtimeMs
      
      if (filePath === APP_SETTINGS_FILE && appSettingsCache && cacheTimestamp.appSettings >= fileModTime) {
        logger.debug(`[Storage] 使用缓存: ${filePath}`)
        return appSettingsCache
      }
      
      if (filePath === TOOLS_STATE_FILE && toolsStateCache && cacheTimestamp.toolsState >= fileModTime) {
        logger.debug(`[Storage] 使用缓存: ${filePath}`)
        return toolsStateCache
      }
    }
    
    const content = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(content)
    logger.info(`[Storage] 读取文件成功: ${filePath}`)
    
    // 更新缓存
    if (useCache) {
      const stats = fs.statSync(filePath)
      if (filePath === APP_SETTINGS_FILE) {
        appSettingsCache = data
        cacheTimestamp.appSettings = stats.mtimeMs
      } else if (filePath === TOOLS_STATE_FILE) {
        toolsStateCache = data
        cacheTimestamp.toolsState = stats.mtimeMs
      }
    }
    
    return data
  } catch (error) {
    logger.error(`[Storage] 读取文件失败: ${filePath}`, error)
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
    logger.info(`[Storage] 写入文件成功: ${filePath}`)
    
    // 清除对应的缓存，强制下次重新读取
    if (filePath === APP_SETTINGS_FILE) {
      appSettingsCache = null
      cacheTimestamp.appSettings = 0
    } else if (filePath === TOOLS_STATE_FILE) {
      toolsStateCache = null
      cacheTimestamp.toolsState = 0
    }
    
    return true
  } catch (error) {
    logger.error(`[Storage] 写入文件失败: ${filePath}`, error)
    return false
  }
}

/**
 * 获取应用设置
 */
export function getAppSettings(): any {
  const settings = readJsonFile(APP_SETTINGS_FILE, DEFAULT_APP_SETTINGS)
  
  // 检查 Skills 目录是否已配置
  if (!settings.general.skillsDirectory) {
    logger.warn('[Storage] Skills 目录未配置，请在设置页面配置 Skills 目录')
    return settings
  }
  
  // 验证 Skills 目录是否存在
  if (!fs.existsSync(settings.general.skillsDirectory)) {
    logger.warn('[Storage] Skills 目录不存在:', settings.general.skillsDirectory)
    logger.warn('[Storage] 请在设置页面重新配置正确的 Skills 目录')
  } else {
    logger.info('[Storage] Skills 目录:', settings.general.skillsDirectory)
  }
  
  return settings
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
 * 清除所有缓存（用于调试或强制刷新）
 */
export function clearCache(): void {
  logger.info('[Storage] 清除所有缓存')
  appSettingsCache = null
  toolsStateCache = null
  cacheTimestamp.appSettings = 0
  cacheTimestamp.toolsState = 0
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
  logger.info('[Storage] 初始化存储系统')
  ensureDataDir()
  
  // 确保配置文件存在
  if (!fs.existsSync(APP_SETTINGS_FILE)) {
    writeJsonFile(APP_SETTINGS_FILE, DEFAULT_APP_SETTINGS)
    logger.warn('[Storage] 首次运行，请在设置页面配置 Skills 目录')
  }
  
  if (!fs.existsSync(TOOLS_STATE_FILE)) {
    writeJsonFile(TOOLS_STATE_FILE, DEFAULT_TOOLS_STATE)
  }
  
  logger.info('[Storage] 存储系统初始化完成')
  logger.info('[Storage] 数据目录:', DATA_DIR)
  
  // 记录当前设置
  const settings = getAppSettings()
  if (settings.general.skillsDirectory) {
    logger.info('[Storage] 已配置 Skills 目录:', settings.general.skillsDirectory)
  } else {
    logger.warn('[Storage] Skills 目录未配置')
  }
}
