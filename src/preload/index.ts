import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  windowMin: () => electronAPI.ipcRenderer.send('window-min'),
  windowMax: () => electronAPI.ipcRenderer.send('window-max'),
  windowClose: () => electronAPI.ipcRenderer.send('window-close'),
  getSkills: (dirPath: string, apiKey?: string) => electronAPI.ipcRenderer.invoke('skills:getSkills', dirPath, apiKey),
  readDirTree: (dirPath: string) => electronAPI.ipcRenderer.invoke('skills:readDirTree', dirPath),
  readFile: (filePath: string) => electronAPI.ipcRenderer.invoke('skills:readFile', filePath),
  translateAndSave: (filePath: string, apiKey: string) => electronAPI.ipcRenderer.invoke('skills:translateAndSave', filePath, apiKey),
  checkToolsInstallation: (toolsConfig: Array<{name: string, dirName: string}>) => electronAPI.ipcRenderer.invoke('tools:checkToolsInstallation', toolsConfig),
  getToolSkills: (toolId: string, skillsPath: string) => electronAPI.ipcRenderer.invoke('tools:getToolSkills', toolId, skillsPath),
  toggleSkill: (toolId: string, skillName: string, enabled: boolean) => electronAPI.ipcRenderer.invoke('tools:toggleSkill', toolId, skillName, enabled),
  toggleTool: (toolId: string, enabled: boolean) => electronAPI.ipcRenderer.invoke('tools:toggleTool', toolId, enabled),
  getToolConfig: (toolId: string) => electronAPI.ipcRenderer.invoke('tools:getToolConfig', toolId),
  saveToolConfig: (toolId: string, config: any) => electronAPI.ipcRenderer.invoke('tools:saveToolConfig', toolId, config)
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
