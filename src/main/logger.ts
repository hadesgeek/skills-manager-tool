/**
 * 日志管理模块
 * 在开发环境输出到控制台，在生产环境输出到文件
 */
import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

// 日志级别
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

class Logger {
  private logDir: string
  private logFile: string
  private maxLogSize = 10 * 1024 * 1024 // 10MB
  private maxLogFiles = 5

  constructor() {
    // 获取日志目录
    this.logDir = path.join(app.getPath('userData'), 'logs')
    this.logFile = path.join(this.logDir, 'app.log')
    
    // 确保日志目录存在
    this.ensureLogDir()
  }

  /**
   * 确保日志目录存在
   */
  private ensureLogDir(): void {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true })
      }
    } catch (error) {
      console.error('创建日志目录失败:', error)
    }
  }

  /**
   * 格式化日志消息
   */
  private formatMessage(level: LogLevel, ...args: any[]): string {
    const timestamp = new Date().toISOString()
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2)
        } catch {
          return String(arg)
        }
      }
      return String(arg)
    }).join(' ')
    
    return `[${timestamp}] [${level}] ${message}`
  }

  /**
   * 写入日志到文件
   */
  private writeToFile(message: string): void {
    try {
      // 检查日志文件大小，如果超过限制则轮转
      if (fs.existsSync(this.logFile)) {
        const stats = fs.statSync(this.logFile)
        if (stats.size > this.maxLogSize) {
          this.rotateLogFiles()
        }
      }

      // 追加日志到文件
      fs.appendFileSync(this.logFile, message + '\n', 'utf8')
    } catch (error) {
      console.error('写入日志文件失败:', error)
    }
  }

  /**
   * 轮转日志文件
   */
  private rotateLogFiles(): void {
    try {
      // 删除最旧的日志文件
      const oldestLog = path.join(this.logDir, `app.${this.maxLogFiles - 1}.log`)
      if (fs.existsSync(oldestLog)) {
        fs.unlinkSync(oldestLog)
      }

      // 重命名现有日志文件
      for (let i = this.maxLogFiles - 2; i >= 0; i--) {
        const oldName = i === 0 
          ? this.logFile 
          : path.join(this.logDir, `app.${i}.log`)
        const newName = path.join(this.logDir, `app.${i + 1}.log`)
        
        if (fs.existsSync(oldName)) {
          fs.renameSync(oldName, newName)
        }
      }
    } catch (error) {
      console.error('轮转日志文件失败:', error)
    }
  }

  /**
   * 记录日志
   */
  private log(level: LogLevel, ...args: any[]): void {
    const message = this.formatMessage(level, ...args)
    
    // 开发环境输出到控制台
    if (process.env.NODE_ENV === 'development') {
      switch (level) {
        case LogLevel.DEBUG:
        case LogLevel.INFO:
          console.log(message)
          break
        case LogLevel.WARN:
          console.warn(message)
          break
        case LogLevel.ERROR:
          console.error(message)
          break
      }
    }
    
    // 生产环境写入文件
    this.writeToFile(message)
  }

  /**
   * DEBUG 级别日志
   */
  debug(...args: any[]): void {
    this.log(LogLevel.DEBUG, ...args)
  }

  /**
   * INFO 级别日志
   */
  info(...args: any[]): void {
    this.log(LogLevel.INFO, ...args)
  }

  /**
   * WARN 级别日志
   */
  warn(...args: any[]): void {
    this.log(LogLevel.WARN, ...args)
  }

  /**
   * ERROR 级别日志
   */
  error(...args: any[]): void {
    this.log(LogLevel.ERROR, ...args)
  }

  /**
   * 获取日志文件路径
   */
  getLogPath(): string {
    return this.logFile
  }

  /**
   * 获取日志目录路径
   */
  getLogDir(): string {
    return this.logDir
  }

  /**
   * 清空日志文件
   */
  clearLogs(): void {
    try {
      const files = fs.readdirSync(this.logDir)
      files.forEach(file => {
        if (file.endsWith('.log')) {
          fs.unlinkSync(path.join(this.logDir, file))
        }
      })
      this.info('日志文件已清空')
    } catch (error) {
      this.error('清空日志文件失败:', error)
    }
  }
}

// 导出单例
export const logger = new Logger()
