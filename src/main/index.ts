import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { setupSkillsIPC } from './ipc/skills'
import { registerStorageHandlers } from './ipc/storage'
import { initStorage } from './storage'
import icon from '../../resources/icon.png?asset'

// 扩展 Electron App 类型，添加 isQuitting 属性
declare module 'electron' {
  interface App {
    isQuitting?: boolean
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
      sandbox: false
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
      console.log('[Window] 窗口已最小化到托盘')
    }
  })

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
  const contextMenu = Menu.buildFromTemplate([
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
    },
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
  ])
  
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
  
  console.log('[Tray] 系统托盘已创建')
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // 初始化存储系统
  initStorage()
  
  // 配置 HTTP 代理用于加速 API 请求
  app.commandLine.appendSwitch('proxy-server', '127.0.0.1:10809')
  // 禁用缓存以避免权限错误
  app.commandLine.appendSwitch('disable-http-cache')
  app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')
  console.log('[Proxy] HTTP proxy configured: 127.0.0.1:10809')

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

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
    console.log('[Window] 窗口已最小化到托盘')
  })

  // Register skills IPC handler
  setupSkillsIPC()
  
  // Register storage IPC handler
  registerStorageHandlers()

  // 创建系统托盘
  createTray()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // 不退出应用，保持托盘运行
  console.log('[App] 所有窗口已关闭，应用继续在托盘运行')
})

// 在应用退出前清理托盘
app.on('before-quit', () => {
  app.isQuitting = true
  if (tray) {
    tray.destroy()
    tray = null
    console.log('[Tray] 系统托盘已销毁')
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
