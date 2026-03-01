import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      windowMin: () => void
      windowMax: () => void
      windowClose: () => void
      getSkills: (dirPath: string, apiKey?: string) => Promise<any[]>
      readDirTree: (dirPath: string) => Promise<any>
      readFile: (filePath: string) => Promise<string | null>
      translateAndSave: (filePath: string, apiKey: string) => Promise<string>
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
    }
  }
}
