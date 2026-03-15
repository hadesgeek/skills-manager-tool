/**
 * 市场 IPC 处理器
 * 处理 Skill 市场相关的 IPC 通信
 */

import { ipcMain } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'
import { logger } from '../logger'
import { getAppSettings, clearCache } from '../storage'
import * as fs from 'fs'
import * as path from 'path'

const execAsync = promisify(exec)

/**
 * 使用 GitHub API 检查路径是否存在
 */
async function checkGitHubPath(owner: string, repo: string, path: string): Promise<boolean> {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
    logger.info(`[Market] 检查 GitHub 路径: ${url}`)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Skills-Manager-App',
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    
    const isValid = response.ok
    logger.info(`[Market] 路径 ${owner}/${repo}/${path} ${isValid ? '存在' : '不存在'}`)
    return isValid
  } catch (error) {
    logger.warn(`[Market] 检查路径失败 ${owner}/${repo}/${path}:`, error)
    return false
  }
}

/**
 * 获取仓库的根目录结构
 */
async function getRepositoryStructure(owner: string, repo: string): Promise<string[]> {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents`
    logger.info(`[Market] 获取仓库结构: ${url}`)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Skills-Manager-App',
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    
    if (!response.ok) {
      logger.warn(`[Market] 获取仓库结构失败: ${response.status}`)
      return []
    }
    
    const contents = await response.json()
    const directories = contents
      .filter((item: any) => item.type === 'dir')
      .map((item: any) => item.name)
    
    logger.info(`[Market] 仓库目录结构:`, directories)
    return directories
  } catch (error) {
    logger.warn(`[Market] 获取仓库结构失败:`, error)
    return []
  }
}

/**
 * 智能检测 Skill 的正确路径
 */
async function detectSkillPath(owner: string, repo: string, skillName: string): Promise<string[]> {
  logger.info(`[Market] 开始智能检测 Skill 路径: ${owner}/${repo}/${skillName}`)
  
  // 获取仓库根目录结构
  const rootDirs = await getRepositoryStructure(owner, repo)
  
  // 构建可能的路径列表
  const possiblePaths: string[] = []
  
  // 1. 直接在根目录下
  possiblePaths.push(`${owner}/${repo}/${skillName}`)
  
  // 2. 在常见的子目录下
  const commonSubdirs = ['skills', 'src', 'packages', 'tools', 'examples', 'agents']
  for (const subdir of commonSubdirs) {
    if (rootDirs.includes(subdir)) {
      possiblePaths.push(`${owner}/${repo}/${subdir}/${skillName}`)
    }
  }
  
  // 3. 在检测到的其他目录下（可能是分类目录）
  for (const dir of rootDirs) {
    if (!commonSubdirs.includes(dir) && !dir.startsWith('.')) {
      possiblePaths.push(`${owner}/${repo}/${dir}/${skillName}`)
    }
  }
  
  // 4. 检查每个可能的路径
  const validPaths: string[] = []
  for (const path of possiblePaths) {
    const pathParts = path.split('/')
    if (pathParts.length >= 3) {
      const subPath = pathParts.slice(2).join('/')
      const isValid = await checkGitHubPath(owner, repo, subPath)
      if (isValid) {
        validPaths.push(path)
      }
    }
  }
  
  logger.info(`[Market] 检测到的有效路径:`, validPaths)
  return validPaths
}

/**
 * 安装请求接口
 */
interface InstallRequest {
  source: string  // degit 源路径，格式：[owner]/[repo]/[path]
  target: string  // 目标路径，通常是 Skills 目录下的子目录
}

/**
 * 安装响应接口
 */
interface InstallResponse {
  success: boolean
  message: string
  error?: {
    code: string
    details: string
  }
}

/**
 * 注册市场相关的 IPC 处理器
 */
export function setupMarketIPC(): void {
  ipcMain.handle('market:installSkill', async (_, source: string, target: string) => {
    logger.info('[IPC:Market] 收到安装请求')
    logger.info('[IPC:Market] Source:', source)
    logger.info('[IPC:Market] Target:', target)
    
    try {
      // 参数验证
      const validation = validateInstallParams(source, target)
      if (!validation.valid) {
        logger.error('[IPC:Market] 参数验证失败:', validation.error)
        return {
          success: false,
          message: '参数验证失败',
          error: {
            code: 'INVALID_PARAMS',
            details: validation.error || '参数无效'
          }
        }
      }
      
      // 执行安装
      const result = await installSkill(source, target)
      logger.info('[IPC:Market] 安装成功:', result)
      
      return {
        success: true,
        message: '安装成功'
      }
    } catch (error: any) {
      logger.error('[IPC:Market] 安装失败:', error)
      
      const parsedError = parseCommandError(error)
      return {
        success: false,
        message: '安装失败',
        error: {
          code: parsedError.code,
          details: parsedError.message
        }
      }
    }
  })
  
  logger.info('[IPC:Market] 市场 IPC 处理器注册完成')
}

/**
 * 验证安装参数
 */
function validateInstallParams(source: string, target: string): { valid: boolean, error?: string } {
  if (!source || !source.trim()) {
    return { valid: false, error: 'source 参数不能为空' }
  }
  
  if (!target || !target.trim()) {
    return { valid: false, error: 'target 参数不能为空' }
  }
  
  // 验证 source 格式：支持 [owner]/[repo] 或 [owner]/[repo]/[path]
  // 修复：移除 github.com/ 前缀的处理，直接验证 owner/repo 格式
  const sourcePattern = /^[^\/\s]+\/[^\/\s]+(?:\/[^\/\s]*)*$/
  if (!sourcePattern.test(source.trim())) {
    return { valid: false, error: 'source 格式无效，应为 [owner]/[repo] 或 [owner]/[repo]/[path]' }
  }
  
  // 验证 target 不包含危险字符
  if (target.includes('..') || target.includes('~')) {
    return { valid: false, error: 'target 路径包含非法字符' }
  }
  
  return { valid: true }
}

/**
 * 执行 Skill 安装（使用智能路径检测）
 */
async function installSkill(source: string, target: string): Promise<string> {
  // 获取应用设置中的 Skills 目录
  const settings = getAppSettings()
  const skillsDir = settings.general.skillsDirectory
  
  if (!skillsDir) {
    throw new Error('Skills 目录未配置，请先在设置中配置 Skills 目录')
  }
  
  // 验证 Skills 目录是否存在
  if (!fs.existsSync(skillsDir)) {
    throw new Error(`Skills 目录不存在：${skillsDir}，请在设置中重新配置`)
  }
  
  // 构建完整的目标路径
  const fullTarget = path.join(skillsDir, target)
  
  // 解析源路径
  const sourceParts = source.split('/')
  if (sourceParts.length < 2) {
    throw new Error('源路径格式无效，应为 owner/repo 格式')
  }
  
  const [owner, repo] = sourceParts
  
  // 使用智能路径检测
  logger.info(`[Market] 开始智能检测 ${owner}/${repo} 中的 ${target} 路径`)
  const validPaths = await detectSkillPath(owner, repo, target)
  
  // 如果没有找到有效路径，使用传统的多路径尝试方式
  if (validPaths.length === 0) {
    logger.warn(`[Market] 智能检测未找到有效路径，使用传统方式`)
    return await installSkillFallback(source, target, fullTarget)
  }
  
  // 尝试每个检测到的有效路径
  let lastError: Error | null = null
  
  for (const validPath of validPaths) {
    try {
      logger.info(`[Market] 尝试从智能检测路径安装: ${validPath}`)
      
      // 构建命令
      const command = `npx -y degit ${validPath} "${fullTarget}" --force`
      logger.info('[Market] 执行命令:', command)
      
      // 执行命令
      const { stdout, stderr } = await execAsync(command, {
        encoding: 'utf8',
        env: {
          ...process.env,
          LANG: 'en_US.UTF-8',
          LC_ALL: 'en_US.UTF-8'
        }
      })
      
      // 记录输出
      if (stdout) {
        logger.info('[Market] 命令输出:', stdout)
      }
      if (stderr) {
        logger.warn('[Market] 命令错误输出:', stderr)
      }
      
      // 验证安装结果
      await validateInstallation(fullTarget, target)
      
      // 清除缓存
      clearCache()
      logger.info('[Market] 已清除缓存，新 Skill 将在下次刷新时显示')
      
      logger.info(`[Market] Skill 安装成功: ${target} (智能检测路径: ${validPath})`)
      return `安装完成 (智能检测路径: ${validPath})`
      
    } catch (error: any) {
      logger.warn(`[Market] 从智能检测路径 ${validPath} 安装失败:`, error.message)
      lastError = error
      
      // 清理失败的安装
      if (fs.existsSync(fullTarget)) {
        try {
          const files = fs.readdirSync(fullTarget)
          if (files.length === 0) {
            fs.rmdirSync(fullTarget)
            logger.info(`[Market] 清理空目录: ${fullTarget}`)
          }
        } catch (cleanupError) {
          logger.warn('[Market] 清理空目录失败:', cleanupError)
        }
      }
      
      continue
    }
  }
  
  // 所有智能检测的路径都失败了
  logger.error('[Market] 所有智能检测的路径都安装失败，尝试传统方式')
  return await installSkillFallback(source, target, fullTarget)
}

/**
 * 传统的多路径尝试安装方式（作为智能检测的后备方案）
 */
async function installSkillFallback(source: string, target: string, fullTarget: string): Promise<string> {
  logger.info('[Market] 使用传统多路径尝试方式')
  
  // 构建智能的可能源路径列表
  const baseRepo = source.split('/').slice(0, 2).join('/') // 获取 owner/repo 部分
  const possibleSources = []
  
  // 如果 source 已经包含子目录，优先使用
  if (source.split('/').length > 2) {
    possibleSources.push(source)
  }
  
  // 添加各种可能的子目录路径
  possibleSources.push(
    `${baseRepo}/${target}`,                  // owner/repo/skillname
    `${baseRepo}/skills/${target}`,           // owner/repo/skills/skillname
    `${baseRepo}/src/${target}`,              // owner/repo/src/skillname
    `${baseRepo}/packages/${target}`,         // owner/repo/packages/skillname
    `${baseRepo}/tools/${target}`,            // owner/repo/tools/skillname
  )
  
  // 最后添加整个仓库作为备选（但会在验证时检测并报错）
  possibleSources.push(baseRepo)
  
  let lastError: Error | null = null
  
  // 依次尝试每个可能的源路径
  for (const trySource of possibleSources) {
    try {
      logger.info(`[Market] 尝试传统路径: ${trySource}`)
      
      // 构建命令
      const command = `npx -y degit ${trySource} "${fullTarget}" --force`
      logger.info('[Market] 执行命令:', command)
      
      // 执行命令
      const { stdout, stderr } = await execAsync(command, {
        encoding: 'utf8',
        env: {
          ...process.env,
          LANG: 'en_US.UTF-8',
          LC_ALL: 'en_US.UTF-8'
        }
      })
      
      // 记录输出
      if (stdout) {
        logger.info('[Market] 命令输出:', stdout)
      }
      if (stderr) {
        logger.warn('[Market] 命令错误输出:', stderr)
      }
      
      // 验证安装结果
      await validateInstallation(fullTarget, target)
      
      // 清除缓存
      clearCache()
      logger.info('[Market] 已清除缓存，新 Skill 将在下次刷新时显示')
      
      logger.info(`[Market] Skill 安装成功: ${target} (传统路径: ${trySource})`)
      return `安装完成 (传统路径: ${trySource})`
      
    } catch (error: any) {
      logger.warn(`[Market] 从传统路径 ${trySource} 安装失败:`, error.message)
      lastError = error
      
      // 清理失败的安装
      if (fs.existsSync(fullTarget)) {
        try {
          const files = fs.readdirSync(fullTarget)
          if (files.length === 0) {
            fs.rmdirSync(fullTarget)
            logger.info(`[Market] 清理空目录: ${fullTarget}`)
          }
        } catch (cleanupError) {
          logger.warn('[Market] 清理空目录失败:', cleanupError)
        }
      }
      
      continue
    }
  }
  
  // 所有路径都失败了
  logger.error('[Market] 所有可能的路径都安装失败')
  throw lastError || new Error('安装失败：找不到有效的 Skill 源路径')
}

/**
 * 解析原始安装命令，提取仓库信息和 skill 名称
 */
function parseSkillInstallCommand(command: string): { source: string, skillName: string } {
  logger.info('[Market] 解析安装命令:', command)
  
  // 匹配 npx skills add 格式的命令
  const skillsAddMatch = command.match(/npx\s+skills\s+add\s+([^\s]+)(?:\s+--skill\s+([^\s]+))?/)
  if (skillsAddMatch) {
    const repoUrl = skillsAddMatch[1]
    const skillName = skillsAddMatch[2]
    
    // 提取 GitHub 仓库信息
    let source = repoUrl.replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '')
    
    // 如果指定了 skill 名称，构建子目录路径
    if (skillName) {
      // 尝试常见的 skill 目录结构
      const possiblePaths = [
        `${source}/${skillName}`,           // 直接在根目录下
        `${source}/skills/${skillName}`,    // 在 skills 子目录下
        `${source}/src/${skillName}`,       // 在 src 子目录下
        `${source}/${skillName}-skill`,     // 带 -skill 后缀
      ]
      
      return { source: possiblePaths[0], skillName } // 先尝试第一个路径
    }
    
    return { source, skillName: extractSkillNameFromUrl(repoUrl) }
  }
  
  // 匹配 degit 格式的命令
  const degitMatch = command.match(/degit\s+([^\s]+)/)
  if (degitMatch) {
    const source = degitMatch[1].replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '')
    return { source, skillName: source.split('/').pop() || 'unknown' }
  }
  
  throw new Error('无法解析安装命令格式')
}

/**
 * 从 URL 中提取 skill 名称
 */
function extractSkillNameFromUrl(url: string): string {
  const parts = url.replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '').split('/')
  return parts[parts.length - 1] || 'unknown'
}
function parseCommandError(error: any): { code: string, message: string } {
  const stderr = error.stderr || error.message || ''
  
  if (stderr.includes('not found') || stderr.includes('404')) {
    return {
      code: 'NOT_FOUND',
      message: '仓库或 Skill 不存在，请检查 URL 是否正确'
    }
  }
  
  if (stderr.includes('permission denied') || stderr.includes('EACCES')) {
    return {
      code: 'PERMISSION_DENIED',
      message: '权限不足，请检查目标目录的写入权限'
    }
  }
  
  if (stderr.includes('ENOSPC')) {
    return {
      code: 'NO_SPACE',
      message: '磁盘空间不足，请清理磁盘空间后重试'
    }
  }
  
  if (stderr.includes('timeout') || stderr.includes('ETIMEDOUT')) {
    return {
      code: 'TIMEOUT',
      message: '下载超时，请检查网络连接后重试'
    }
  }
  
  if (stderr.includes('network') || stderr.includes('ENOTFOUND')) {
    return {
      code: 'NETWORK_ERROR',
      message: '网络错误，请检查网络连接'
    }
  }
  
  return {
    code: 'UNKNOWN',
    message: stderr || '未知错误'
  }
}

/**
 * 验证安装结果
 */
async function validateInstallation(fullTarget: string, skillName: string): Promise<void> {
  logger.info('[Market] 验证安装结果:', fullTarget)
  
  // 检查目标目录是否存在
  if (!fs.existsSync(fullTarget)) {
    throw new Error(`安装失败：目标目录不存在 ${fullTarget}`)
  }
  
  // 检查是否为目录
  const stats = fs.statSync(fullTarget)
  if (!stats.isDirectory()) {
    throw new Error(`安装失败：目标路径不是目录 ${fullTarget}`)
  }
  
  // 列出安装的文件（用于调试）
  const files = fs.readdirSync(fullTarget)
  logger.info(`[Market] 安装的文件列表:`, files)
  
  // 检查是否下载了整个仓库（通过检查是否有多个顶级目录）
  const directories = files.filter(file => {
    const filePath = path.join(fullTarget, file)
    return fs.statSync(filePath).isDirectory()
  })
  
  // 如果有很多目录，可能下载了整个仓库
  if (directories.length > 5) {
    logger.warn(`[Market] 警告：检测到 ${directories.length} 个目录，可能下载了整个仓库`)
    logger.warn('[Market] 目录列表:', directories)
  }
  
  // 检查是否有 SKILL.MD 或 skill.md 文件
  const skillMdPath = path.join(fullTarget, 'SKILL.MD')
  const skillMdPathLower = path.join(fullTarget, 'skill.md')
  const readmePath = path.join(fullTarget, 'README.md')
  
  if (fs.existsSync(skillMdPath) || fs.existsSync(skillMdPathLower)) {
    logger.info(`[Market] 验证通过：${skillName} 包含 Skill 描述文件`)
  } else if (fs.existsSync(readmePath)) {
    logger.info(`[Market] 找到 README.md 文件，可能是有效的 Skill`)
  } else {
    logger.warn(`[Market] 警告：${skillName} 目录中未找到 SKILL.MD、skill.md 或 README.md 文件`)
    logger.warn('[Market] 这可能不是一个有效的 Skill 目录，或者下载了整个仓库')
    
    // 检查是否有常见的仓库文件（表明下载了整个仓库）
    const repoFiles = ['.git', '.github', 'package.json', 'node_modules', 'src', 'lib', 'dist']
    const foundRepoFiles = repoFiles.filter(file => files.includes(file))
    
    if (foundRepoFiles.length > 2) {
      throw new Error(`安装失败：似乎下载了整个仓库而不是特定的 Skill。找到的仓库文件: ${foundRepoFiles.join(', ')}`)
    }
  }
}