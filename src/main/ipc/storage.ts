import { ipcMain } from 'electron'
import {
  getAppSettings,
  saveAppSettings,
  getToolsState,
  saveToolsState,
  getToolConfig,
  saveToolConfig,
  updateToolEnabled,
  updateToolSkills,
  updateToolInstallation
} from '../storage'
import { logger } from '../logger'

/**
 * 注册存储相关的 IPC 处理函数
 */
export function registerStorageHandlers(): void {
  // 获取应用设置
  ipcMain.handle('storage:getAppSettings', async () => {
    logger.info('[IPC:Storage] 获取应用设置')
    return getAppSettings()
  })

  // 保存应用设置
  ipcMain.handle('storage:saveAppSettings', async (_event, settings) => {
    logger.info('[IPC:Storage] 保存应用设置')
    return saveAppSettings(settings)
  })

  // 获取工具状态
  ipcMain.handle('storage:getToolsState', async () => {
    logger.info('[IPC:Storage] 获取工具状态')
    return getToolsState()
  })

  // 保存工具状态
  ipcMain.handle('storage:saveToolsState', async (_event, state) => {
    logger.info('[IPC:Storage] 保存工具状态')
    return saveToolsState(state)
  })

  // 获取单个工具配置
  ipcMain.handle('storage:getToolConfig', async (_event, toolId: string) => {
    logger.info('[IPC:Storage] 获取工具配置:', toolId)
    return getToolConfig(toolId)
  })

  // 保存单个工具配置
  ipcMain.handle('storage:saveToolConfig', async (_event, toolId: string, config: any) => {
    logger.info('[IPC:Storage] 保存工具配置:', toolId)
    return saveToolConfig(toolId, config)
  })

  // 更新工具启用状态
  ipcMain.handle('storage:updateToolEnabled', async (_event, toolId: string, enabled: boolean) => {
    logger.info('[IPC:Storage] 更新工具启用状态:', toolId, enabled)
    return updateToolEnabled(toolId, enabled)
  })

  // 更新工具 Skills 启用状态
  ipcMain.handle('storage:updateToolSkills', async (_event, toolId: string, skillId: string, enabled: boolean) => {
    logger.info('[IPC:Storage] 更新工具 Skills 状态:', toolId, skillId, enabled)
    return updateToolSkills(toolId, skillId, enabled)
  })

  // 更新工具安装状态和路径
  ipcMain.handle('storage:updateToolInstallation', async (_event, toolId: string, installed: boolean, configPath: string, skillsPath: string) => {
    logger.info('[IPC:Storage] 更新工具安装状态:', toolId, installed)
    return updateToolInstallation(toolId, installed, configPath, skillsPath)
  })

  logger.info('[IPC:Storage] 存储处理函数注册完成')
}
