import { ipcMain } from 'electron'
import {
  getAppSettings,
  saveAppSettings,
  getToolsState,
  saveToolsState,
  getToolConfig,
  saveToolConfig,
  updateToolEnabled,
  updateToolSkills
} from '../storage'

/**
 * 注册存储相关的 IPC 处理函数
 */
export function registerStorageHandlers(): void {
  // 获取应用设置
  ipcMain.handle('storage:getAppSettings', async () => {
    console.log('[IPC] 获取应用设置')
    return getAppSettings()
  })

  // 保存应用设置
  ipcMain.handle('storage:saveAppSettings', async (_event, settings) => {
    console.log('[IPC] 保存应用设置')
    return saveAppSettings(settings)
  })

  // 获取工具状态
  ipcMain.handle('storage:getToolsState', async () => {
    console.log('[IPC] 获取工具状态')
    return getToolsState()
  })

  // 保存工具状态
  ipcMain.handle('storage:saveToolsState', async (_event, state) => {
    console.log('[IPC] 保存工具状态')
    return saveToolsState(state)
  })

  // 获取单个工具配置
  ipcMain.handle('storage:getToolConfig', async (_event, toolId: string) => {
    console.log('[IPC] 获取工具配置:', toolId)
    return getToolConfig(toolId)
  })

  // 保存单个工具配置
  ipcMain.handle('storage:saveToolConfig', async (_event, toolId: string, config: any) => {
    console.log('[IPC] 保存工具配置:', toolId)
    return saveToolConfig(toolId, config)
  })

  // 更新工具启用状态
  ipcMain.handle('storage:updateToolEnabled', async (_event, toolId: string, enabled: boolean) => {
    console.log('[IPC] 更新工具启用状态:', toolId, enabled)
    return updateToolEnabled(toolId, enabled)
  })

  // 更新工具 Skills 启用状态
  ipcMain.handle('storage:updateToolSkills', async (_event, toolId: string, skillId: string, enabled: boolean) => {
    console.log('[IPC] 更新工具 Skills 状态:', toolId, skillId, enabled)
    return updateToolSkills(toolId, skillId, enabled)
  })

  console.log('[IPC] 存储处理函数注册完成')
}
