import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // 窗口控制
  windowMin: () => electronAPI.ipcRenderer.send('window-min'),
  windowMax: () => electronAPI.ipcRenderer.send('window-max'),
  windowClose: () => electronAPI.ipcRenderer.send('window-close'),
  
  // Skills 管理
  getSkills: (dirPath: string, apiKey?: string) => electronAPI.ipcRenderer.invoke('skills:getSkills', dirPath, apiKey),
  getSkillsFast: (dirPath: string) => electronAPI.ipcRenderer.invoke('skills:getSkillsFast', dirPath),
  translateSkillDesc: (skillPath: string, apiKey: string) => electronAPI.ipcRenderer.invoke('skills:translateSkillDesc', skillPath, apiKey),
  generateSkillIcon: (skillName: string, skillDesc: string, apiKey: string) => electronAPI.ipcRenderer.invoke('skills:generateSkillIcon', skillName, skillDesc, apiKey),
  readDirTree: (dirPath: string) => electronAPI.ipcRenderer.invoke('skills:readDirTree', dirPath),
  readFile: (filePath: string) => electronAPI.ipcRenderer.invoke('skills:readFile', filePath),
  writeFile: (filePath: string, content: string) => electronAPI.ipcRenderer.invoke('skills:writeFile', filePath, content),
  translateAndSave: (filePath: string, apiKey: string) => electronAPI.ipcRenderer.invoke('skills:translateAndSave', filePath, apiKey),
  
  // 工具管理
  checkToolsInstallation: (toolsConfig: Array<{name: string, dirName: string}>) => electronAPI.ipcRenderer.invoke('tools:checkToolsInstallation', toolsConfig),
  getToolSkills: (toolId: string, skillsPath: string) => electronAPI.ipcRenderer.invoke('tools:getToolSkills', toolId, skillsPath),
  toggleSkill: (toolId: string, skillName: string, enabled: boolean) => electronAPI.ipcRenderer.invoke('tools:toggleSkill', toolId, skillName, enabled),
  toggleTool: (toolId: string, enabled: boolean) => electronAPI.ipcRenderer.invoke('tools:toggleTool', toolId, enabled),
  getToolConfig: (toolId: string) => electronAPI.ipcRenderer.invoke('tools:getToolConfig', toolId),
  saveToolConfig: (toolId: string, config: any) => electronAPI.ipcRenderer.invoke('tools:saveToolConfig', toolId, config),
  
  // 存储管理
  getAppSettings: () => electronAPI.ipcRenderer.invoke('storage:getAppSettings'),
  saveAppSettings: (settings: any) => electronAPI.ipcRenderer.invoke('storage:saveAppSettings', settings),
  getToolsState: () => electronAPI.ipcRenderer.invoke('storage:getToolsState'),
  saveToolsState: (state: any) => electronAPI.ipcRenderer.invoke('storage:saveToolsState', state),
  getStorageToolConfig: (toolId: string) => electronAPI.ipcRenderer.invoke('storage:getToolConfig', toolId),
  saveStorageToolConfig: (toolId: string, config: any) => electronAPI.ipcRenderer.invoke('storage:saveToolConfig', toolId, config),
  updateToolEnabled: (toolId: string, enabled: boolean) => electronAPI.ipcRenderer.invoke('storage:updateToolEnabled', toolId, enabled),
  updateToolSkills: (toolId: string, skillId: string, enabled: boolean) => electronAPI.ipcRenderer.invoke('storage:updateToolSkills', toolId, skillId, enabled),
  updateToolInstallation: (toolId: string, installed: boolean, configPath: string, skillsPath: string) => electronAPI.ipcRenderer.invoke('storage:updateToolInstallation', toolId, installed, configPath, skillsPath),
  
  // 日志管理
  getLogPath: () => electronAPI.ipcRenderer.invoke('logger:get-log-path'),
  getLogDir: () => electronAPI.ipcRenderer.invoke('logger:get-log-dir'),
  readLogs: () => electronAPI.ipcRenderer.invoke('logger:read-logs'),
  clearLogs: () => electronAPI.ipcRenderer.invoke('logger:clear-logs'),
  
  // 开发者工具
  toggleDevTools: () => electronAPI.ipcRenderer.invoke('devtools:toggle'),
  
  // 对话框
  openDirectory: () => electronAPI.ipcRenderer.invoke('dialog:openDirectory'),
  
  // 市场管理
  installSkill: (source: string, target: string) => electronAPI.ipcRenderer.invoke('market:installSkill', source, target)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
