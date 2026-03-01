import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { setupSkillsIPC } from './ipc/skills'
import { registerStorageHandlers } from './ipc/storage'
import { initStorage } from './storage'
import { logger } from './logger'
import * as fs from 'fs'
import icon from '../../resources/icon.png?asset'

// 扩展 App 类型，添加 isQuitting 属性
declare global {
  namespace Electron {
    interface App {
      isQuitting?: boolean
    }
  }
}

// 全局变量
let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      devTools: is.dev // 只在开发环境启用 DevTools
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 监听窗口关闭事件，最小化到托盘而不是退出
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
      logger.info('[Window] 窗口已最小化到托盘')
    }
  })

  // 只在开发环境注册快捷键和自动打开 DevTools
  if (is.dev) {
    // 注册快捷键打开 DevTools（F12 和 Ctrl+Shift+I）
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' || 
          (input.control && input.shift && input.key.toLowerCase() === 'i')) {
        if (mainWindow) {
          if (mainWindow.webContents.isDevToolsOpened()) {
            mainWindow.webContents.closeDevTools()
            logger.info('[DevTools] 关闭开发者工具')
          } else {
            mainWindow.webContents.openDevTools()
            logger.info('[DevTools] 打开开发者工具')
          }
        }
        event.preventDefault()
      }
    })

    // 开发环境自动打开 DevTools
    mainWindow.webContents.openDevTools()
  }

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

/**
 * 创建系统托盘
 */
function createTray(): void {
  // 创建托盘图标
  const trayIcon = nativeImage.createFromPath(icon)
  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }))
  
  // 设置托盘提示文本
  tray.setToolTip('Skills Manager Tool')
  
  // 创建托盘右键菜单
  const menuTemplate: any[] = [
    {
      label: '打开',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        } else {
          createWindow()
        }
      }
    }
  ]

  // 只在开发环境添加开发者工具菜单
  if (is.dev) {
    menuTemplate.push({
      label: '开发者工具',
      click: () => {
        if (mainWindow) {
          if (!mainWindow.isVisible()) {
            mainWindow.show()
            mainWindow.focus()
          }
          if (mainWindow.webContents.isDevToolsOpened()) {
            mainWindow.webContents.closeDevTools()
          } else {
            mainWindow.webContents.openDevTools()
          }
        }
      }
    })
  }

  menuTemplate.push(
    {
      type: 'separator'
    },
    {
      label: '退出',
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  )

  const contextMenu = Menu.buildFromTemplate(menuTemplate)
  
  // 设置托盘右键菜单
  tray.setContextMenu(contextMenu)
  
  // 双击托盘图标显示窗口
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    } else {
      createWindow()
    }
  })
  
  logger.info('[Tray] 系统托盘已创建')
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // 记录应用启动
  logger.info('='.repeat(80))
  logger.info('应用启动')
  logger.info(`版本: ${app.getVersion()}`)
  logger.info(`环境: ${process.env.NODE_ENV || 'production'}`)
  logger.info(`平台: ${process.platform}`)
  logger.info(`日志路径: ${logger.getLogPath()}`)
  logger.info('='.repeat(80))
  
  // 初始化存储系统
  initStorage()
  
  // 配置 HTTP 代理用于加速 API 请求
  // app.commandLine.appendSwitch('proxy-server', '127.0.0.1:10809')
  // 禁用缓存以避免权限错误
  app.commandLine.appendSwitch('disable-http-cache')
  app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')
  // logger.info('[Proxy] HTTP proxy configured: 127.0.0.1:10809')

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => logger.debug('pong'))

  // Window Controls IPC
  ipcMain.on('window-min', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.minimize()
  })
  ipcMain.on('window-max', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })
  ipcMain.on('window-close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    // 最小化到托盘而不是关闭
    win?.hide()
    logger.info('[Window] 窗口已最小化到托盘')
  })

  // Register skills IPC handler
  setupSkillsIPC()
  
  // Register storage IPC handler
  registerStorageHandlers()
  
  // Register logger IPC handlers
  ipcMain.handle('logger:get-log-path', () => {
    return logger.getLogPath()
  })
  
  ipcMain.handle('logger:get-log-dir', () => {
    return logger.getLogDir()
  })
  
  ipcMain.handle('logger:clear-logs', () => {
    logger.clearLogs()
    return true
  })
  
  ipcMain.handle('logger:read-logs', async () => {
    try {
      const logPath = logger.getLogPath()
      if (fs.existsSync(logPath)) {
        return fs.readFileSync(logPath, 'utf8')
      }
      return ''
    } catch (error) {
      logger.error('读取日志文件失败:', error)
      return ''
    }
  })
  
  // 打开外部路径
  ipcMain.on('open-external', (_, path) => {
    shell.openPath(path)
  })
  
  // 打开/关闭 DevTools
  ipcMain.handle('devtools:toggle', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      if (win.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools()
        logger.info('[DevTools] 通过 IPC 关闭开发者工具')
        return false
      } else {
        win.webContents.openDevTools()
        logger.info('[DevTools] 通过 IPC 打开开发者工具')
        return true
      }
    }
    return false
  })
  
  // 打开目录选择对话框
  ipcMain.handle('dialog:openDirectory', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory', 'createDirectory'],
        title: '选择 Skills 目录'
      })
      
      if (result.canceled) {
        return null
      }
      
      return result.filePaths[0]
    } catch (error) {
      logger.error('[Dialog] 打开目录对话框失败:', error)
      return null
    }
  })

  // 创建系统托盘
  createTray()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
}).catch((error) => {
  logger.error('[App] 应用启动失败:', error)
  logger.error('[App] Stack:', error.stack)
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // 不退出应用，保持托盘运行
  logger.info('[App] 所有窗口已关闭，应用继续在托盘运行')
})

// 在应用退出前清理托盘
app.on('before-quit', () => {
  app.isQuitting = true
  if (tray) {
    tray.destroy()
    tray = null
    logger.info('[Tray] 系统托盘已销毁')
  }
  logger.info('应用退出')
})

// 捕获未处理的异常
process.on('uncaughtException', (error) => {
  logger.error('[UncaughtException]', error)
  logger.error('[UncaughtException] Stack:', error.stack)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('[UnhandledRejection] Reason:', reason)
  logger.error('[UnhandledRejection] Promise:', promise)
  if (reason instanceof Error) {
    logger.error('[UnhandledRejection] Stack:', reason.stack)
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
