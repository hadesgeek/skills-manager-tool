/**
 * 带日期命名的构建脚本
 * 输出目录：build/YYYY-MM-DD
 * artifact 文件名包含日期
 */

const { execSync } = require('child_process')
const path = require('path')

// 生成当前日期字符串，格式：YYYY-MM-DD
const now = new Date()
const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

// 解析命令行参数（--win / --mac / --linux）
const args = process.argv.slice(2).join(' ') || '--win'

// 构建输出目录
const outputDir = path.join('build', dateStr).replace(/\\/g, '/')

console.log(`[build-dated] 日期: ${dateStr}`)
console.log(`[build-dated] 输出目录: ${outputDir}`)
console.log(`[build-dated] 构建参数: ${args}`)

// 通过环境变量传递给 electron-builder
const env = {
  ...process.env,
  BUILD_DATE: dateStr,
  BUILD_OUTPUT_DIR: outputDir
}

try {
  execSync(`npx electron-builder ${args} --config.directories.output=${outputDir} --config.nsis.artifactName="\${name}-\${version}-${dateStr}-setup.\${ext}"`, {
    stdio: 'inherit',
    env
  })
  console.log(`\n[build-dated] 构建完成，文件保存在: ${outputDir}`)
} catch (err) {
  console.error('[build-dated] 构建失败:', err.message)
  process.exit(1)
}
