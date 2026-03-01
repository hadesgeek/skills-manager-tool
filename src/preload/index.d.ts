import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      // 窗口控制
      windowMin: () => void
      windowMax: () => void
      windowClose: () => void
      
      // Skills 管理
      getSkills: (dirPath: string, apiKey?: string) => Promise<any[]>
      readDirTree: (dirPath: string) => Promise<any>
      readFile: (filePath: string) => Promise<string | null>
      translateAndSave: (filePath: string, apiKey: string) => Promise<string>
      
      // 工具管理
      checkToolsInstallation: (toolsConfig: Array<{name: string, dirName: string}>) => Promise<Array<{
        id: string
        installed: boolean
        configPath: string
        skillsPath: string
      }>>
      getToolSkills: (toolId: string, skillsPath: string) => Promise<Array<{name: string, desc: string, active: boolean}>>
      toggleSkill: (toolId: string, skillName: string, enabled: boolean) => Promise<boolean>
      toggleTool: (toolId: string, enabled: boolean) => Promise<boolean>
      getToolConfig: (toolId: string) => Promise<any>
      saveToolConfig: (toolId: string, config: any) => Promise<boolean>
      
      // 存储管理
      getAppSettings: () => Promise<any>
      saveAppSettings: (settings: any) => Promise<boolean>
      getToolsState: () => Promise<any>
      saveToolsState: (state: any) => Promise<boolean>
      getStorageToolConfig: (toolId: string) => Promise<any>
      saveStorageToolConfig: (toolId: string, config: any) => Promise<boolean>
      updateToolEnabled: (toolId: string, enabled: boolean) => Promise<boolean>
      updateToolSkills: (toolId: string, skillId: string, enabled: boolean) => Promise<boolean>
      updateToolInstallation: (toolId: string, installed: boolean, configPath: string, skillsPath: string) => Promise<boolean>
      
      // 对话框
      openDirectory: () => Promise<string | null>
    }
  }
}
