<template>
  <div class="market-page">
    <header class="content-header">
      <h1 class="content-title">Market</h1>
      <div class="header-actions">
        <div class="search-box">
          <input 
            type="text" 
            placeholder="搜索 Skill" 
            v-model="searchKeyword"
            @keydown="handleSearchKeydown"
            @input="handleSearchInput"
          />
          <button 
            class="search-btn"
            @click="handleSearch"
            :disabled="!searchKeyword.trim()"
          >
            🔍
          </button>
        </div>
        <button 
          class="install-btn"
          :class="{ 
            'install-btn-enabled': isDetailPage && !isInstalling,
            'install-btn-loading': isInstalling 
          }"
          :disabled="!isDetailPage || isInstalling"
          @click="handleInstall"
        >
          {{ isInstalling ? '安装中...' : (isDetailPage ? '一键安装' : '一键安装当前 Skill') }}
        </button>
      </div>
    </header>

    <div class="market-content">
      <webview
        ref="webviewRef"
        :src="webviewUrl"
        class="market-webview"
        partition="persist:skills-market"
        allowpopups
        @did-navigate="handleNavigate"
        @did-navigate-in-page="handleNavigate"
        @did-fail-load="handleLoadFail"
        @did-start-loading="() => isWebviewLoading = true"
        @did-stop-loading="() => isWebviewLoading = false"
      />
      
      <!-- 加载指示器 -->
      <div v-if="isWebviewLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <div class="loading-text">加载中...</div>
      </div>
      
      <!-- 错误提示 -->
      <div v-if="installError" class="error-notification">
        {{ installError }}
        <button @click="installError = null" class="error-close">×</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { detectSkillDetailPage } from '../utils/urlDetector'

// 响应式状态变量
const searchKeyword = ref('')
const isDetailPage = ref(false)
const currentSkillUrl = ref('')
const installCommand = ref('')
const degitSource = ref('')
const skillName = ref('')  // 新增：存储 skill 名称
const isInstalling = ref(false)
const installError = ref<string | null>(null)
const webviewUrl = ref('https://skills.sh')
const isWebviewLoading = ref(false)

// Webview 引用
const webviewRef = ref<any>(null)

// 搜索功能
function handleSearch(): void {
  if (!searchKeyword.value.trim()) {
    // 空搜索，返回首页
    webviewUrl.value = 'https://skills.sh'
    console.log('[Market] 返回首页')
    return
  }
  
  // URL 编码搜索词
  const encodedKeyword = encodeURIComponent(searchKeyword.value.trim())
  
  // 更新 Webview URL
  webviewUrl.value = `https://skills.sh/?q=${encodedKeyword}`
  
  console.log('[Market] 搜索:', searchKeyword.value)
  console.log('[Market] 更新 URL 为:', webviewUrl.value)
}

// 监听输入变化（实时搜索）
function handleSearchInput(): void {
  // 可以添加防抖逻辑，这里先简化处理
  if (searchKeyword.value.trim()) {
    handleSearch()
  }
}

// 监听回车键
function handleSearchKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    handleSearch()
  }
}

// Webview 导航事件处理
function handleNavigate(event: Event): void {
  const webview = event.target as any
  const url = webview.getURL()
  
  console.log('[Market] Webview 导航到:', url)
  
  // 检测是否为详情页
  const urlInfo = detectSkillDetailPage(url)
  
  if (urlInfo.isDetailPage) {
    console.log('[Market] 检测到详情页:', urlInfo)
    isDetailPage.value = true
    currentSkillUrl.value = url
    
    // 提取安装命令
    extractInstallCommand()
  } else {
    console.log('[Market] 非详情页，禁用安装按钮')
    isDetailPage.value = false
    currentSkillUrl.value = ''
    installCommand.value = ''
    degitSource.value = ''
    skillName.value = ''  // 清空 skill 名称
  }
}

// DOM 提取逻辑
async function extractInstallCommand(): Promise<void> {
  const webview = webviewRef.value
  if (!webview) {
    console.error('[Market] Webview 引用不存在')
    return
  }
  
  try {
    console.log('[Market] 开始提取安装命令...')
    
    // 执行 JavaScript 提取 DOM 内容
    const command = await webview.executeJavaScript(`
      (function() {
        try {
          // 尝试多个可能的选择器
          const selectors = [
            'body > div:nth-child(6) > main > div:nth-child(2) > button > code',
            'main button code',
            '[data-install-command]',
            'button code',
            'pre code',
            'code'
          ]
          
          for (const selector of selectors) {
            const element = document.querySelector(selector)
            if (element && element.textContent) {
              console.log('找到元素，选择器:', selector, '内容:', element.textContent.trim())
              return element.textContent.trim()
            }
          }
          
          // 如果没找到，尝试查找包含 "npx" 或 "degit" 的文本
          const allElements = document.querySelectorAll('*')
          for (const el of allElements) {
            const text = el.textContent || ''
            if (text.includes('npx') && text.includes('degit')) {
              console.log('通过关键词找到元素:', text.trim())
              return text.trim()
            }
          }
          
          return null
        } catch (error) {
          console.error('DOM 提取出错:', error)
          return null
        }
      })()
    `)
    
    if (!command) {
      throw new Error('页面中未找到安装命令')
    }
    
    console.log('[Market] 提取到安装命令:', command)
    installCommand.value = command
    
    // 解析 degit 源路径
    try {
      const parseResult = parseInstallCommand(command)
      degitSource.value = parseResult.source
      skillName.value = parseResult.skillName
      console.log('[Market] 解析到 degit 源:', degitSource.value, 'Skill 名称:', skillName.value)
    } catch (parseError: any) {
      console.error('[Market] 命令解析失败:', parseError.message)
      console.log('[Market] 原始命令内容:', command)
      // 尝试更宽松的解析
      const fallbackResult = extractSourceFromCommand(command)
      if (fallbackResult) {
        degitSource.value = fallbackResult.source
        skillName.value = fallbackResult.skillName
        console.log('[Market] 使用备用解析结果:', fallbackResult)
      } else {
        throw parseError
      }
    }
    
  } catch (error: any) {
    console.error('[Market] 提取安装命令失败:', error)
    installError.value = '无法提取安装命令，请稍后重试'
  }
}

// 解析安装命令，提取 degit 源路径和 skill 名称
function parseInstallCommand(command: string): { source: string, skillName: string } {
  console.log('[Market] 解析命令:', command)
  
  // 匹配 npx skills add 格式的命令
  const skillsAddMatch = command.match(/npx\s+skills\s+add\s+([^\s]+)(?:\s+--skill\s+([^\s]+))?/)
  if (skillsAddMatch) {
    const repoUrl = skillsAddMatch[1]
    const skillName = skillsAddMatch[2]
    
    // 提取 GitHub 仓库信息
    let source = repoUrl.replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '')
    
    // 如果指定了 skill 名称，返回基础仓库路径，让后端处理子目录逻辑
    if (skillName) {
      console.log('[Market] 解析结果 - 仓库:', source, 'Skill:', skillName)
      return { source, skillName }
    }
    
    // 如果没有指定 skill 名称，从 URL 中提取
    const urlParts = source.split('/')
    const extractedSkillName = urlParts[urlParts.length - 1] || 'unknown'
    console.log('[Market] 解析结果 - 仓库:', source, 'Skill:', extractedSkillName)
    return { source, skillName: extractedSkillName }
  }
  
  // 匹配 degit 格式的命令
  const degitMatch = command.match(/degit\s+([^\s]+)/)
  if (degitMatch) {
    let source = degitMatch[1]
    source = source.replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '')
    
    const urlParts = source.split('/')
    const skillName = urlParts[urlParts.length - 1] || 'unknown'
    
    console.log('[Market] 解析结果 - 仓库:', source, 'Skill:', skillName)
    return { source, skillName }
  }
  
  throw new Error('无效的安装命令格式')
}

// 备用的更宽松的源路径提取
function extractSourceFromCommand(command: string): { source: string, skillName: string } | null {
  console.log('[Market] 使用备用解析:', command)
  
  // 尝试多种模式
  const patterns = [
    // npx skills add 格式
    {
      pattern: /npx\s+skills\s+add\s+([^\s]+)(?:\s+--skill\s+([^\s]+))?/,
      handler: (match: RegExpMatchArray) => {
        const repoUrl = match[1]
        const skillName = match[2]
        let source = repoUrl.replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '')
        
        if (skillName) {
          return { source, skillName }
        }
        
        const urlParts = source.split('/')
        return { source, skillName: urlParts[urlParts.length - 1] || 'unknown' }
      }
    },
    // degit 格式
    {
      pattern: /degit\s+([^\s]+)/,
      handler: (match: RegExpMatchArray) => {
        let source = match[1]
        source = source.replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '')
        
        const urlParts = source.split('/')
        return { source, skillName: urlParts[urlParts.length - 1] || 'unknown' }
      }
    },
    // GitHub URL 格式
    {
      pattern: /github\.com\/([^\/\s]+\/[^\/\s]+(?:\/[^\/\s]*)?)/,
      handler: (match: RegExpMatchArray) => {
        let source = match[1]
        source = source.replace(/\.git$/, '')
        
        const urlParts = source.split('/')
        return { source, skillName: urlParts[urlParts.length - 1] || 'unknown' }
      }
    }
  ]
  
  for (const { pattern, handler } of patterns) {
    const match = command.match(pattern)
    if (match) {
      const result = handler(match)
      console.log('[Market] 备用解析结果:', result)
      return result
    }
  }
  
  return null
}

// 安装功能
async function handleInstall(): Promise<void> {
  if (!degitSource.value) {
    showErrorNotification('安装信息不完整')
    return
  }
  
  // 获取目标目录名称
  // 优先使用解析出的 skillName，如果没有则使用 URL 中的 skillName
  const targetDir = skillName.value || detectSkillDetailPage(currentSkillUrl.value).skillName
  
  // 设置安装状态
  isInstalling.value = true
  installError.value = null
  
  try {
    console.log('[Market] 开始安装 Skill:', degitSource.value)
    
    // 调用 IPC
    const result = await window.api.installSkill(degitSource.value, targetDir)
    
    if (result.success) {
      console.log('[Market] 安装成功')
      showSuccessNotification('Skill 安装成功！点击 Skills 页面的刷新按钮查看新安装的 Skill')
    } else {
      console.error('[Market] 安装失败:', result.error)
      showErrorNotification(`安装失败：${result.error?.details || '未知错误'}`)
    }
  } catch (error: any) {
    console.error('[Market] 安装异常:', error)
    showErrorNotification(`安装异常：${error.message}`)
  } finally {
    isInstalling.value = false
  }
}

// Webview 加载失败处理
function handleLoadFail(event: any): void {
  const { errorCode, errorDescription } = event
  
  console.error('[Market] Webview 加载失败:', errorCode, errorDescription)
  
  // 显示错误页面
  if (errorCode === -106) {
    // 网络连接失败
    showErrorNotification('网络连接失败，请检查网络设置')
  } else if (errorCode === -105) {
    // DNS 解析失败
    showErrorNotification('无法访问 skills.sh，请检查网络连接')
  } else {
    showErrorNotification(`加载失败：${errorDescription}`)
  }
}

// 显示成功通知
function showSuccessNotification(message: string): void {
  // 这里可以使用 Toast 组件或其他通知方式
  alert(message) // 临时使用 alert，后续可以替换为更好的通知组件
}

// 显示错误通知
function showErrorNotification(message: string): void {
  installError.value = message
  console.error('[Market] 错误通知:', message)
  
  // 3秒后自动隐藏错误提示
  setTimeout(() => {
    if (installError.value === message) {
      installError.value = null
    }
  }, 3000)
}

// 组件生命周期钩子
onMounted(() => {
  const webview = webviewRef.value
  if (!webview) {
    console.error('[Market] Webview 引用不存在')
    return
  }
  
  console.log('[Market] Market 组件已挂载，Webview 事件监听器已注册')
  console.log('[Market] 初始 Webview URL:', webviewUrl.value)
  
  // 添加更多事件监听器用于调试
  webview.addEventListener('dom-ready', () => {
    console.log('[Market] Webview DOM 已准备就绪')
  })
  
  webview.addEventListener('did-finish-load', () => {
    console.log('[Market] Webview 页面加载完成')
  })
})
</script>

<style scoped>
.market-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content-header {
  height: 80px;
  padding: 0 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #E5E7EB;
}

.content-title {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 24px;
  color: #1F2937;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-box {
  width: 240px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-box input {
  border: none;
  outline: none;
  font-size: 13px;
  color: #374151;
  flex: 1;
  font-family: 'Inter', sans-serif;
}

.search-box input::placeholder {
  color: #9CA3AF;
}

.search-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #6B7280;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.search-btn:hover:not(:disabled) {
  background-color: #F3F4F6;
  color: #374151;
}

.search-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.install-btn {
  height: 36px;
  padding: 0 16px;
  background-color: #F3F4F6;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  cursor: not-allowed;
  transition: all 0.2s;
}

.install-btn-enabled {
  background-color: #6366F1;
  border-color: #6366F1;
  color: #FFFFFF;
  cursor: pointer;
}

.install-btn-enabled:hover {
  background-color: #5B21B6;
  border-color: #5B21B6;
}

.install-btn-loading {
  background-color: #9CA3AF;
  border-color: #9CA3AF;
  color: #FFFFFF;
  cursor: not-allowed;
}

.market-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.market-webview {
  width: 100%;
  height: 100%;
  border: none;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #E5E7EB;
  border-top: 3px solid #6366F1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #6B7280;
}

.error-notification {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 8px;
  padding: 12px 16px;
  color: #DC2626;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 400px;
}

.error-close {
  background: none;
  border: none;
  color: #DC2626;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-close:hover {
  background-color: #FECACA;
  border-radius: 4px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
