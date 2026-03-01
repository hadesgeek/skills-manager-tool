/**
 * 前端日志工具
 * 将日志发送到主进程记录
 */

class RendererLogger {
  private prefix = '[Renderer]'

  /**
   * 记录调试信息
   */
  debug(...args: any[]): void {
    console.debug(this.prefix, ...args)
  }

  /**
   * 记录一般信息
   */
  info(...args: any[]): void {
    console.log(this.prefix, ...args)
  }

  /**
   * 记录警告信息
   */
  warn(...args: any[]): void {
    console.warn(this.prefix, ...args)
  }

  /**
   * 记录错误信息
   */
  error(...args: any[]): void {
    console.error(this.prefix, ...args)
  }

  /**
   * 记录详细的错误信息
   */
  errorDetail(message: string, error: any): void {
    console.error(this.prefix, message)
    console.error(this.prefix, '错误详情:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
      raw: error
    })
  }
}

export const logger = new RendererLogger()

// 捕获全局错误
window.addEventListener('error', (event) => {
  logger.error('[GlobalError]', event.error || event.message)
})

// 捕获未处理的 Promise 拒绝
window.addEventListener('unhandledrejection', (event) => {
  logger.error('[UnhandledRejection]', event.reason)
})
