/**
 * 显示当前配置的 Gemini API Key
 * 
 * 使用方法：
 * node skills-manager-app/test/show-api-key.js
 */

const fs = require('fs')
const path = require('path')
const os = require('os')

// 获取 Electron 应用的 userData 路径
// Windows: C:\Users\<用户名>\AppData\Roaming\skills-manager-app
const appName = 'skills-manager-app'
const userDataPath = path.join(os.homedir(), 'AppData', 'Roaming', appName)
const settingsFile = path.join(userDataPath, 'data', 'app-settings.json')

console.log('='.repeat(60))
console.log('Gemini API Key 查询工具')
console.log('='.repeat(60))
console.log()

console.log('配置文件路径:', settingsFile)
console.log()

try {
  // 检查文件是否存在
  if (!fs.existsSync(settingsFile)) {
    console.log('❌ 配置文件不存在')
    console.log('提示: 请先在应用的设置页面配置 API Key')
    process.exit(1)
  }

  // 读取配置文件
  const content = fs.readFileSync(settingsFile, 'utf8')
  const settings = JSON.parse(content)

  // 提取 API Key
  const apiKey = settings?.ai?.geminiApiKey || ''

  if (!apiKey) {
    console.log('⚠️  API Key 未配置')
    console.log('提示: 请在应用的设置页面输入 Gemini API Key')
  } else {
    console.log('✅ API Key 已配置')
    console.log()
    console.log('完整 API Key:')
    console.log(apiKey)
    console.log()
    console.log('前缀显示:')
    console.log(apiKey.substring(0, 20) + '...')
  }

  console.log()
  console.log('完整配置信息:')
  console.log(JSON.stringify(settings, null, 2))

} catch (error) {
  console.error('❌ 读取配置文件失败:', error.message)
  process.exit(1)
}

console.log()
console.log('='.repeat(60))
