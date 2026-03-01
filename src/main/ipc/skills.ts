import { ipcMain } from 'electron'
import { join, basename } from 'path'
import * as fs from 'fs'
import { app } from 'electron'
import { getToolConfig as getStorageToolConfig, getAppSettings } from '../storage/index.js'

/**
 * 获取图标存储目录
 */
function getIconsDir(): string {
    const dataDir = join(app.getPath('userData'), 'data', 'tools-imgs')
    
    // 确保目录存在
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
        console.log('[GetIconsDir] 创建图标目录:', dataDir)
    }
    
    return dataDir
}

/**
 * 获取图标映射文件路径
 */
function getIconMappingPath(): string {
    const dataDir = join(app.getPath('userData'), 'data')
    return join(dataDir, 'skill-icons.json')
}

/**
 * 读取图标映射
 */
function readIconMapping(): Record<string, string> {
    const mappingPath = getIconMappingPath()
    
    if (!fs.existsSync(mappingPath)) {
        return {}
    }
    
    try {
        const content = fs.readFileSync(mappingPath, 'utf8')
        return JSON.parse(content)
    } catch (error) {
        console.error('[ReadIconMapping] 读取图标映射失败:', error)
        return {}
    }
}

/**
 * 保存图标映射
 */
function saveIconMapping(mapping: Record<string, string>): void {
    const mappingPath = getIconMappingPath()
    
    try {
        fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2), 'utf8')
        console.log('[SaveIconMapping] 图标映射已保存')
    } catch (error) {
        console.error('[SaveIconMapping] 保存图标映射失败:', error)
    }
}

/**
 * 获取 Skill 的图标路径
 */
function getSkillIconPath(skillName: string): string | undefined {
    const mapping = readIconMapping()
    const iconFileName = mapping[skillName]
    
    if (!iconFileName) {
        return undefined
    }
    
    const iconPath = join(getIconsDir(), iconFileName)
    
    if (!fs.existsSync(iconPath)) {
        console.warn(`[GetSkillIconPath] 图标文件不存在: ${iconPath}`)
        return undefined
    }
    
    return iconPath
}

/**
 * 保存 Skill 图标
 */
function saveSkillIcon(skillName: string, imageData: string): string {
    const iconsDir = getIconsDir()
    
    // 生成文件名（使用 skill 名称 + 时间戳）
    const timestamp = Date.now()
    const fileName = `${skillName.replace(/[^a-zA-Z0-9-_]/g, '_')}_${timestamp}.png`
    const iconPath = join(iconsDir, fileName)
    
    // 将 base64 数据写入文件
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    fs.writeFileSync(iconPath, buffer)
    
    console.log(`[SaveSkillIcon] 图标已保存: ${iconPath}`)
    
    // 更新映射
    const mapping = readIconMapping()
    
    // 删除旧图标文件（如果存在）
    if (mapping[skillName]) {
        const oldIconPath = join(iconsDir, mapping[skillName])
        if (fs.existsSync(oldIconPath)) {
            fs.unlinkSync(oldIconPath)
            console.log(`[SaveSkillIcon] 删除旧图标: ${oldIconPath}`)
        }
    }
    
    mapping[skillName] = fileName
    saveIconMapping(mapping)
    
    return iconPath
}

/**
 * 技能数据结构定义
 */
export interface Skill {
    id: string      // 技能唯一标识符
    name: string    // 技能名称
    desc: string    // 技能描述
    path: string    // 技能目录路径
    icon?: string   // 图标 URL（可选）
    needsTranslation?: boolean  // 是否需要翻译（可选）
}

/**
 * 设置技能相关的 IPC 通信处理器
 * 注册所有与技能管理相关的 IPC 通道
 */
export function setupSkillsIPC(): void {
    // 获取技能列表的 IPC 处理器
    ipcMain.handle('skills:getSkills', async (_, dirPath: string, apiKey?: string) => {
        return await readSkills(dirPath, apiKey)
    })
    
    // 获取技能列表（快速版本，不等待翻译）
    ipcMain.handle('skills:getSkillsFast', async (_, dirPath: string) => {
        return await readSkillsFast(dirPath)
    })
    
    // 翻译单个技能描述
    ipcMain.handle('skills:translateSkillDesc', async (_, skillPath: string, apiKey: string) => {
        return await translateSkillDesc(skillPath, apiKey)
    })
    
    // 生成技能图标
    ipcMain.handle('skills:generateSkillIcon', async (_, skillName: string, skillDesc: string, apiKey: string) => {
        return await generateSkillIcon(skillName, skillDesc, apiKey)
    })

    // 读取目录树结构的 IPC 处理器
    ipcMain.handle('skills:readDirTree', async (_, dirPath: string) => {
        return await readDirTree(dirPath)
    })

    // 读取单个文件内容的 IPC 处理器
    ipcMain.handle('skills:readFile', async (_, filePath: string) => {
        try {
            return await fs.promises.readFile(filePath, 'utf8')
        } catch (err: any) {
            if (err.code === 'ENOENT') return null // 文件不存在时静默返回 null
            throw err // 其他错误继续抛出
        }
    })
    
    // 写入单个文件内容的 IPC 处理器
    ipcMain.handle('skills:writeFile', async (_, filePath: string, content: string) => {
        try {
            await fs.promises.writeFile(filePath, content, 'utf8')
            return true
        } catch (err) {
            console.error('[WriteFile] 写入文件失败:', err)
            throw err
        }
    })
    
    // 打开目录选择对话框
    ipcMain.handle('dialog:openDirectory', async () => {
        const { dialog, BrowserWindow } = require('electron')
        const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow()!, {
            properties: ['openDirectory']
        })
        
        if (result.canceled) {
            return null
        }
        
        return result.filePaths[0]
    })

    // 翻译文件并保存的 IPC 处理器
    ipcMain.handle('skills:translateAndSave', async (_, filePath: string, apiKey: string) => {
        return await translateAndSave(filePath, apiKey)
    })

    // 检测工具目录是否存在的 IPC 处理器
    ipcMain.handle('tools:checkToolsInstallation', async (_, toolsConfig: Array<{name: string, dirName: string}>) => {
        return await checkToolsInstallation(toolsConfig)
    })

    // 获取工具的 Skills 列表的 IPC 处理器
    ipcMain.handle('tools:getToolSkills', async (_, toolId: string, skillsPath: string) => {
        return await getToolSkills(toolId, skillsPath)
    })

    // 切换工具的 Skill 状态（启用/禁用）
    ipcMain.handle('tools:toggleSkill', async (_, toolId: string, skillName: string, enabled: boolean) => {
        return await toggleSkill(toolId, skillName, enabled)
    })

    // 切换工具开关
    ipcMain.handle('tools:toggleTool', async (_, toolId: string, enabled: boolean) => {
        return await toggleTool(toolId, enabled)
    })

    // 获取工具配置
    ipcMain.handle('tools:getToolConfig', async (_, toolId: string) => {
        return await getToolConfig(toolId)
    })

    // 保存工具配置
    ipcMain.handle('tools:saveToolConfig', async (_, toolId: string, config: any) => {
        return await saveToolConfig(toolId, config)
    })
}

/**
 * 快速读取技能列表（不等待翻译）
 * 立即返回基本信息，翻译和图标生成由前端异步调用
 */
async function readSkillsFast(dirPath: string): Promise<Skill[]> {
    console.log(`[ReadSkillsFast] Starting with dirPath: ${dirPath}`)
    
    try {
        // 检查目录是否存在
        if (!fs.existsSync(dirPath)) {
            console.log(`[ReadSkillsFast] Directory not found: ${dirPath}`)
            return []
        }

        // 读取目录下的所有项目
        const items = await fs.promises.readdir(dirPath, { withFileTypes: true })
        const skills: Skill[] = []

        // 遍历每个项目
        for (const item of items) {
            if (item.isDirectory()) {
                const skillDirPath = join(dirPath, item.name)
                // 尝试读取 SKILL.MD（大写）
                const skillMdPath = join(skillDirPath, 'SKILL.MD')
                // 尝试读取 skill.md（小写）
                const skillMdPathLower = join(skillDirPath, 'skill.md')
                // 描述翻译缓存文件路径
                const descCachePath = join(skillDirPath, '.desc_cn.md')

                let mdContent = ''
                // 优先读取大写版本
                if (fs.existsSync(skillMdPath)) {
                    mdContent = await fs.promises.readFile(skillMdPath, 'utf8')
                } else if (fs.existsSync(skillMdPathLower)) {
                    // 如果大写不存在，读取小写版本
                    mdContent = await fs.promises.readFile(skillMdPathLower, 'utf8')
                }

                if (mdContent) {
                    let desc: string
                    let icon: string | undefined
                    let needsTranslation = false  // 标记是否需要翻译

                    // 检查是否有缓存的翻译
                    if (fs.existsSync(descCachePath)) {
                        desc = (await fs.promises.readFile(descCachePath, 'utf8')).trim()
                        console.log(`[ReadSkillsFast] ${item.name} - 使用缓存的描述`)
                        needsTranslation = false
                    } else {
                        // 使用原始描述
                        desc = extractDescription(mdContent)
                        console.log(`[ReadSkillsFast] ${item.name} - 使用原始描述，需要翻译`)
                        needsTranslation = true  // 没有缓存，需要翻译
                    }
                    
                    // 从映射中获取图标路径
                    const iconPath = getSkillIconPath(item.name)
                    if (iconPath && fs.existsSync(iconPath)) {
                        // 读取图片文件并转换为 base64
                        const imageBuffer = fs.readFileSync(iconPath)
                        const base64Image = imageBuffer.toString('base64')
                        icon = `data:image/png;base64,${base64Image}`
                        console.log(`[ReadSkillsFast] ${item.name} - 使用缓存的图标`)
                    }

                    // 添加技能到列表
                    skills.push({
                        id: item.name,
                        name: item.name,
                        desc,
                        path: skillDirPath,
                        icon,
                        needsTranslation  // 添加标志位
                    })
                }
            }
        }

        return skills
    } catch (error) {
        console.error('[ReadSkillsFast] Error reading skills directory:', error)
        return []
    }
}

/**
 * 翻译单个技能描述
 */
async function translateSkillDesc(skillPath: string, apiKey: string): Promise<{ desc: string }> {
    const skillName = basename(skillPath)
    const startTime = Date.now()
    const label = `[TranslateSkillDesc] ${skillName}`
    
    try {
        console.log(`${label} - 开始翻译描述`)
        
        // 读取 SKILL.MD
        const skillMdPath = join(skillPath, 'SKILL.MD')
        const skillMdPathLower = join(skillPath, 'skill.md')
        const descCachePath = join(skillPath, '.desc_cn.md')
        
        // 如果已有缓存，直接返回
        if (fs.existsSync(descCachePath)) {
            const desc = (await fs.promises.readFile(descCachePath, 'utf8')).trim()
            console.log(`${label} - 使用缓存的翻译`)
            return { desc }
        }
        
        console.log(`${label} - 读取 Skill 文件...`)
        let mdContent = ''
        if (fs.existsSync(skillMdPath)) {
            mdContent = await fs.promises.readFile(skillMdPath, 'utf8')
            console.log(`${label} - 读取 SKILL.MD，大小: ${mdContent.length} 字符`)
        } else if (fs.existsSync(skillMdPathLower)) {
            mdContent = await fs.promises.readFile(skillMdPathLower, 'utf8')
            console.log(`${label} - 读取 skill.md，大小: ${mdContent.length} 字符`)
        }
        
        if (!mdContent) {
            console.error(`${label} - Skill MD 文件未找到`)
            throw new Error('Skill MD file not found')
        }
        
        // 提取原始描述
        const rawDesc = extractDescription(mdContent)
        console.log(`${label} - 原始描述: ${rawDesc}`)
        
        // 翻译描述
        console.log(`${label} - 调用翻译 API...`)
        const translateStartTime = Date.now()
        const desc = await translateDescription(rawDesc, apiKey)
        const translateTime = Date.now() - translateStartTime
        
        console.log(`${label} - 翻译完成，耗时: ${translateTime}ms`)
        console.log(`${label} - 翻译结果: ${desc}`)
        
        // 保存到缓存
        await fs.promises.writeFile(descCachePath, desc, 'utf8')
        console.log(`${label} - 翻译已保存到缓存`)
        
        const totalTime = Date.now() - startTime
        console.log(`${label} - ✓ 翻译完成！总耗时: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`)
        
        return { desc }
    } catch (error) {
        const totalTime = Date.now() - startTime
        console.error(`${label} - ✗ 翻译失败，耗时: ${totalTime}ms`)
        console.error(`${label} - 错误详情:`, error)
        throw error
    }
}

/**
 * 生成技能图标
 * 使用 Gemini Nano Banana (gemini-2.5-flash-image) 模型生成图标
 */
async function generateSkillIcon(skillName: string, skillDesc: string, apiKey: string): Promise<{ icon: string }> {
    const startTime = Date.now()
    const label = `[GenerateSkillIcon] ${skillName}`
    console.log(`[generateSkillIcon] API Key provided: ${apiKey ? 'YES (length: ' + apiKey.length + ')' : 'NO'}`)
    try {
        console.log(`${label} - 开始生成图标`)
        console.log(`${label} - 描述: ${skillDesc}`)
        
        // 构建提示词（修改为 50x50）
        const prompt = `A simple, clean, minimalist icon for a coding skill: ${skillName}. ${skillDesc}. Flat design, professional, vibrant colors, 50x50 pixels, icon only, no text.`
        console.log(`${label} - 提示词: ${prompt}`)
        
        // 构建 Gemini Nano Banana API 请求 URL
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`
        
        const body = {
            contents: [{
                role: 'user',
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.9
            }
        }
        
        console.log(`${label} - 发送请求到 Nano Banana API...`)
        const requestStartTime = Date.now()
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(body)
        })
        
        const requestTime = Date.now() - requestStartTime
        console.log(`${label} - 收到响应，耗时: ${requestTime}ms`)
        console.log(`${label} - 响应状态: ${response.status} ${response.statusText}`)
        
        if (!response.ok) {
            const errorText = await response.text()
            console.error(`${label} - API 错误: ${response.status}`, errorText)
            throw new Error(`Gemini Nano Banana API error: ${response.statusText}`)
        }
        
        console.log(`${label} - 解析响应数据...`)
        const data = await response.json()
        
        // 提取图像数据
        const parts = data?.candidates?.[0]?.content?.parts || []
        console.log(`${label} - 响应包含 ${parts.length} 个部分`)
        
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i]
            if (part.inlineData) {
                const imageData = part.inlineData.data
                const mimeType = part.inlineData.mimeType
                
                console.log(`${label} - 找到图像数据 (部分 ${i + 1})`)
                console.log(`${label} - MIME 类型: ${mimeType}`)
                console.log(`${label} - 数据大小: ${imageData.length} 字符 (约 ${Math.round(imageData.length * 0.75 / 1024)} KB)`)
                
                // 转换为 data URL
                const dataUrl = `data:${mimeType};base64,${imageData}`
                
                // 保存图标到文件系统
                console.log(`${label} - 保存图标到文件系统...`)
                saveSkillIcon(skillName, dataUrl)
                
                const totalTime = Date.now() - startTime
                console.log(`${label} - ✓ 图标生成成功！总耗时: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`)
                
                // 返回 data URL（而不是 file:// URL）
                return { icon: dataUrl }
            }
        }
        
        console.error(`${label} - 响应中未找到图像数据`)
        console.error(`${label} - 响应结构:`, JSON.stringify(data, null, 2))
        throw new Error('No image data in response')
    } catch (error) {
        const totalTime = Date.now() - startTime
        console.error(`${label} - ✗ 生成图标失败，耗时: ${totalTime}ms`)
        console.error(`${label} - 错误详情:`, error)
        throw error
    }
}

/**
 * 读取指定目录下的所有技能
 * @param dirPath 技能目录路径
 * @param apiKey Gemini API Key（可选，用于翻译描述）
 * @returns 技能列表数组
 */

async function readSkills(dirPath: string, apiKey?: string): Promise<Skill[]> {
    console.log(`[ReadSkills] Starting with dirPath: ${dirPath}`)
    console.log(`[ReadSkills] API Key provided: ${apiKey ? 'YES (length: ' + apiKey.length + ')' : 'NO'}`)
    
    try {
        // 检查目录是否存在
        if (!fs.existsSync(dirPath)) {
            console.log(`[ReadSkills] Directory not found: ${dirPath}`)
            return []
        }

        // 读取目录下的所有项目
        const items = await fs.promises.readdir(dirPath, { withFileTypes: true })
        const skills: Skill[] = []

        // 遍历每个项目
        for (const item of items) {
            if (item.isDirectory()) {
                const skillDirPath = join(dirPath, item.name)
                // 尝试读取 SKILL.MD（大写）
                const skillMdPath = join(skillDirPath, 'SKILL.MD')
                // 尝试读取 skill.md（小写）
                const skillMdPathLower = join(skillDirPath, 'skill.md')
                // 描述翻译缓存文件路径
                const descCachePath = join(skillDirPath, '.desc_cn.md')

                let mdContent = ''
                // 优先读取大写版本
                if (fs.existsSync(skillMdPath)) {
                    mdContent = await fs.promises.readFile(skillMdPath, 'utf8')
                } else if (fs.existsSync(skillMdPathLower)) {
                    // 如果大写不存在，读取小写版本
                    mdContent = await fs.promises.readFile(skillMdPathLower, 'utf8')
                }

                if (mdContent) {
                    let desc: string

                    // 优先级 1: 从缓存的翻译文件中读取
                    if (fs.existsSync(descCachePath)) {
                        desc = (await fs.promises.readFile(descCachePath, 'utf8')).trim()
                        console.log(`[ReadSkills] ${item.name} - 使用缓存的描述`)
                    } else {
                        // 从 Markdown 内容中提取原始描述
                        const rawDesc = extractDescription(mdContent)
                        console.log(`[ReadSkills] ${item.name} - 已提取描述`)
                        // 如果提供了 API Key，则翻译描述并缓存
                        if (apiKey) {
                            console.log(`[ReadSkills] ${item.name} - 提供了 API Key，正在翻译...`)
                            try {
                                desc = await translateDescription(rawDesc, apiKey)
                                // 将翻译结果保存到缓存文件
                                await fs.promises.writeFile(descCachePath, desc, 'utf8')
                                console.log(`[ReadSkills] ${item.name} - 翻译已缓存`)
                            } catch (err) {
                                console.error('翻译描述失败:', item.name, err)
                                // 翻译失败时使用原始描述
                                desc = rawDesc
                            }
                        } else {
                            console.log(`[ReadSkills] ${item.name} - 无 API Key，使用原始描述`)
                            // 没有 API Key 时直接使用原始描述
                            desc = rawDesc
                        }
                    }

                    // 添加技能到列表
                    skills.push({
                        id: item.name,
                        name: item.name,
                        desc,
                        path: skillDirPath
                    })
                }
            }
        }

        return skills
    } catch (error) {
        console.error('Error reading skills directory:', error)
        return []
    }
}

/**
 * 从 Markdown 内容中提取描述信息
 * 优先从 YAML frontmatter 中提取 description 字段
 * 如果没有，则提取第一个非空段落作为描述
 * @param mdContent Markdown 文件内容
 * @returns 提取的描述文本
 */
function extractDescription(mdContent: string): string {
    // 尝试匹配 YAML frontmatter 中的 description 字段
    const yamlMatch = mdContent.match(/description:\s*(.+)/i)
    if (yamlMatch && yamlMatch[1]) {
        return yamlMatch[1].trim()
    }

    // 如果没有 YAML frontmatter，尝试找到第一个非空段落
    // 移除所有 Markdown 标题行
    const withoutHeaders = mdContent.replace(/^#+.*$/gm, '')
    // 匹配第一个非空白段落
    const paragraphMatch = withoutHeaders.match(/\n\s*([^\n]+)/)

    if (paragraphMatch && paragraphMatch[1]) {
        return paragraphMatch[1].trim()
    }

    return '无描述'
}

/**
 * 使用 Gemini API 翻译描述文本为简体中文
 * @param rawDesc 原始描述文本
 * @param apiKey Gemini API Key
 * @returns 翻译后的中文描述
 */
async function translateDescription(rawDesc: string, apiKey: string): Promise<string> {
    // 构建 Gemini API 请求 URL
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
    
    // 系统提示词
    const systemPrompt = `Act as a professional localization expert. Translate the following skill description into natural, concise Simplified Chinese.
    Requirements:
    - Analyze & Summarize: Do not translate word-for-word. Extract the core functionality (what the skill does) and rephrase it.
    - Tone: Professional, user-centric, and action-oriented.
    - Constraint: Maximum 2 lines. Keep it punchy and avoid jargon.
    - Format: Output only the translated result.`
    
    // 构建请求体，使用系统提示词和用户输入分离
    const body = {
        system_instruction: {
            parts: [{
                text: systemPrompt
            }]
        },
        contents: [{
            role: 'user',
            parts: [{
                text: rawDesc
            }]
        }],
        generationConfig: { 
            temperature: 0.1, // 低温度以获得更稳定的翻译结果
            thinking_config: {
                thinking_budget: 0 // 禁用思维链，大幅提升速度（从 7-16 秒降到 1 秒左右）
            }
        }
    }
    // 创建性能计时标签
    const label = `[Gemini-Desc] ${Date.now()}`
    console.time(label)
    console.log(`${label} - Start translating`)
    console.log(`${label} - Original: ${rawDesc}`)
    
    try {
        // 配置请求选项，明确指定 UTF-8 编码
        const fetchOptions: RequestInit = {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json; charset=utf-8',
                'Accept': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(body)
        }
        
        console.log(`${label} - Request URL: ${url.substring(0, 80)}...`)
        console.log(`${label} - Proxy should be: 127.0.0.1:10809 (configured in main process)`)
        console.log(`${label} - Sending request...`)
        
        // 发送 POST 请求到 Gemini API（代理已在主进程配置）
        const startTime = Date.now()
        const response = await fetch(url, fetchOptions)
        const requestTime = Date.now() - startTime
        
        console.log(`${label} - Response received in ${requestTime}ms`)
        console.log(`${label} - Response status: ${response.status} ${response.statusText}`)
        
        // 检查响应状态
        if (!response.ok) {
            const errorText = await response.text()
            console.error(`${label} - API Error: ${response.status} ${response.statusText}`)
            console.error(`${label} - Error details: ${errorText}`)
            throw new Error(`Gemini API error: ${response.statusText}`)
        }
        
        // 解析响应数据
        const data = await response.json()
        
        // 提取翻译文本
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
        if (!text) {
            console.error(`${label} - Empty response from API`)
            console.error(`${label} - Response data:`, JSON.stringify(data, null, 2))
            throw new Error('Empty response from Gemini API')
        }
        
        const result = text.trim()
        console.log(`${label} - Translated: ${result}`)
        return result
    } catch (error) {
        console.error(`${label} - Translation failed:`, error)
        throw error
    } finally {
        // 结束计时
        console.timeEnd(label)
    }
}

/**
 * 文件树节点结构定义
 */
export interface FileNode {
    name: string        // 文件/目录名称
    path: string        // 完整路径
    isDirectory: boolean // 是否为目录
    children?: FileNode[] // 子节点（仅目录有）
}

/**
 * 递归读取目录树结构
 * @param dirPath 目录路径
 * @returns 文件树节点对象
 */
async function readDirTree(dirPath: string): Promise<FileNode> {
    // 获取路径的文件系统状态
    const stats = await fs.promises.stat(dirPath)
    const isDirectory = stats.isDirectory()

    // 创建当前节点
    const node: FileNode = {
        name: basename(dirPath),
        path: dirPath,
        isDirectory
    }

    // 如果是目录，递归读取子项
    if (isDirectory) {
        node.children = []
        const items = await fs.promises.readdir(dirPath, { withFileTypes: true })

        // 排序：目录在前，然后按名称排序
        const sortedItems = items.sort((a, b) => {
            if (a.isDirectory() && !b.isDirectory()) return -1
            if (!a.isDirectory() && b.isDirectory()) return 1
            return a.name.localeCompare(b.name)
        })

        // 递归处理每个子项
        for (const item of sortedItems) {
            const childPath = join(dirPath, item.name)
            node.children.push(await readDirTree(childPath))
        }
    }

    return node
}

/**
 * 翻译 Markdown 文件并保存为 _cn.md 文件
 * @param filePath 原始文件路径
 * @param apiKey Gemini API Key
 * @returns 翻译后的内容
 */
async function translateAndSave(filePath: string, apiKey: string): Promise<string> {
    // 读取原始文件内容
    const originalContent = await fs.promises.readFile(filePath, 'utf8')

    // 构建 Gemini 2.5 Flash API 请求 URL
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
    // 构建请求体，使用系统提示词和用户输入分离
    const body = {
        system_instruction: {
            parts: [{
                text: '你是一个专业的 Markdown 文档翻译助手。将用户提供的 Markdown 文档翻译成自然流畅的简体中文。必须保持所有 Markdown 格式完整，包括代码块、标题、表格等。只返回翻译后的 Markdown 内容，不要添加任何解释或额外内容。'
            }]
        },
        contents: [{
            role: 'user',
            parts: [{
                text: originalContent
            }]
        }],
        generationConfig: {
            temperature: 0.1, // 低温度以获得更稳定的翻译结果
            thinking_config: {
                thinking_budget: 0 // 禁用思维链，大幅提升速度（从 7-16 秒降到 1 秒左右）
            }
        }
    }

    // 创建性能计时标签
    const label = `[Gemini-File] ${basename(filePath)}`
    console.time(label)
    console.log(`${label} - Start translating`)
    console.log(`${label} - File: ${filePath}`)
    console.log(`${label} - Size: ${originalContent.length} chars`)
    
    try {
        // 配置请求选项，明确指定 UTF-8 编码
        const fetchOptions: RequestInit = {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json; charset=utf-8',
                'Accept': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(body)
        }
        
        console.log(`${label} - Request URL: ${url.substring(0, 80)}...`)
        console.log(`${label} - Proxy should be: 127.0.0.1:10809 (configured in main process)`)
        console.log(`${label} - Sending request...`)
        
        // 发送 POST 请求到 Gemini API（代理已在主进程配置）
        const startTime = Date.now()
        const response = await fetch(url, fetchOptions)
        const requestTime = Date.now() - startTime
        
        console.log(`${label} - Response received in ${requestTime}ms`)
        console.log(`${label} - Response status: ${response.status} ${response.statusText}`)

        // 检查响应状态
        if (!response.ok) {
            const errorText = await response.text()
            console.error(`${label} - API Error: ${response.status} ${response.statusText}`)
            console.error(`${label} - Error details: ${errorText}`)
            throw new Error(`Gemini API error: ${response.statusText}`)
        }

        // 解析响应数据
        const data = await response.json()
        const translatedContent = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''

        if (!translatedContent) {
            console.error(`${label} - Empty response from API`)
            throw new Error('Empty response from Gemini API')
        }

        console.log(`${label} - Translation completed: ${translatedContent.length} chars`)

        // 移除 Gemini 可能添加的代码围栏包装（```markdown ... ```）
        const cleaned = translatedContent
            .replace(/^```(?:markdown)?\s*\n?/i, '')
            .replace(/\n?```\s*$/i, '')
            .trim()

        // 构建翻译文件路径（在原文件名后添加 _cn）
        const extIndex = filePath.lastIndexOf('.')
        const basePath = extIndex !== -1 ? filePath.substring(0, extIndex) : filePath
        const ext = extIndex !== -1 ? filePath.substring(extIndex) : '.md'
        const cnPath = `${basePath}_cn${ext}`

        // 保存翻译结果到 _cn.md 文件（使用 UTF-8 without BOM）
        await fs.promises.writeFile(cnPath, cleaned, { encoding: 'utf8' })
        console.log(`${label} - 已保存到: ${cnPath}`)

        return cleaned
    } catch (error) {
        console.error(`${label} - Translation failed:`, error)
        throw error
    } finally {
        // 结束计时
        console.timeEnd(label)
    }
}

/**
 * 工具安装状态结构定义
 */
export interface ToolInstallationStatus {
    id: string          // 工具 ID
    installed: boolean  // 是否已安装
    configPath: string  // 配置目录路径
    skillsPath: string  // Skills 目录路径
}

/**
 * 检测工具是否已安装
 * 通过检查用户目录下是否存在对应的工具配置目录来判断
 * @param toolsConfig 工具配置列表
 * @returns 工具安装状态列表
 */
async function checkToolsInstallation(
    toolsConfig: Array<{name: string, dirName: string}>
): Promise<ToolInstallationStatus[]> {
    // 获取用户主目录
    const homeDir = process.env.HOME || process.env.USERPROFILE || ''
    console.log(`[CheckTools] Home directory: ${homeDir}`)
    
    const results: ToolInstallationStatus[] = []
    
    for (const tool of toolsConfig) {
        // 生成工具 ID（小写，空格转连字符）
        const id = tool.name.toLowerCase().replace(/\s+/g, '-')
        // 构建配置目录路径
        const configPath = join(homeDir, tool.dirName)
        // 构建 Skills 目录路径
        const skillsPath = join(configPath, 'skills')
        
        // 检查配置目录是否存在
        const installed = fs.existsSync(configPath)
        
        console.log(`[CheckTools] ${tool.name} (${tool.dirName}): ${installed ? '已检测到' : '未检测到'}`)
        
        results.push({
            id,
            installed,
            configPath: installed ? configPath : '',
            skillsPath: installed ? skillsPath : ''
        })
    }
    
    return results
}

/**
 * 获取程序数据目录
 */
function getDataDir(): string {
    // 获取程序所在目录
    const appPath = process.cwd()
    const dataDir = join(appPath, 'data')
    
    // 确保 data 目录存在
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
    }
    
    return dataDir
}

/**
 * 获取 Skills 管理目录（从应用设置中读取）
 */
function getSkillsManagerDir(): string {
    try {
        const appSettings = getAppSettings()
        const skillsDir = appSettings?.general?.skillsDirectory || ''
        
        if (!skillsDir) {
            console.error(`[GetSkillsManagerDir] 应用设置中未配置 skillsDirectory`)
            return ''
        }
        
        if (!fs.existsSync(skillsDir)) {
            console.error(`[GetSkillsManagerDir] Skills 目录不存在: ${skillsDir}`)
            return ''
        }
        
        console.log(`[GetSkillsManagerDir] Skills 目录: ${skillsDir}`)
        return skillsDir
    } catch (error) {
        console.error(`[GetSkillsManagerDir] 读取 Skills 目录失败:`, error)
        return ''
    }
}

/**
 * 获取工具配置文件路径
 */
function getToolConfigPath(toolId: string): string {
    const dataDir = getDataDir()
    return join(dataDir, `${toolId}.json`)
}

/**
 * 获取工具配置
 */
async function getToolConfig(toolId: string): Promise<any> {
    const configPath = getToolConfigPath(toolId)
    
    if (!fs.existsSync(configPath)) {
        // 返回默认配置
        return {
            enabled: false,
            skills: {}
        }
    }
    
    try {
        const content = await fs.promises.readFile(configPath, 'utf8')
        return JSON.parse(content)
    } catch (error) {
        console.error(`[GetToolConfig] 读取配置失败: ${toolId}`, error)
        return {
            enabled: false,
            skills: {}
        }
    }
}

/**
 * 保存工具配置
 */
async function saveToolConfig(toolId: string, config: any): Promise<boolean> {
    const configPath = getToolConfigPath(toolId)
    
    try {
        await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8')
        console.log(`[SaveToolConfig] 配置已保存: ${toolId}`)
        return true
    } catch (error) {
        console.error(`[SaveToolConfig] 保存配置失败: ${toolId}`, error)
        return false
    }
}

/**
 * 获取工具的 Skills 列表
 * 从用户指定的 Skills 目录读取所有 Skills，并标记哪些已启用
 */
async function getToolSkills(toolId: string, skillsPath: string): Promise<Array<{name: string, desc: string, active: boolean}>> {
    if (!skillsPath || !fs.existsSync(skillsPath)) {
        console.log(`[GetToolSkills] Skills 路径未找到: ${skillsPath}`)
        return []
    }
    
    // 获取工具配置
    const config = await getToolConfig(toolId)
    
    // 使用 readSkills 函数读取所有 Skills（不需要 API Key，因为不翻译）
    const allSkills = await readSkills(skillsPath)
    
    console.log(`[GetToolSkills] readSkills 返回了 ${allSkills.length} 个 skills`)
    console.log(`[GetToolSkills] 第一个 skill:`, allSkills[0])
    
    // 转换为工具 Skills 格式，标记哪些已启用
    const toolSkills = allSkills.map(skill => ({
        name: skill.name,
        desc: skill.desc,
        active: config.skills[skill.name] || false
    }))
    
    console.log(`[GetToolSkills] ${toolId} 的 Skills 数量: ${toolSkills.length}`)
    console.log(`[GetToolSkills] 第一个转换后的 skill:`, toolSkills[0])
    return toolSkills
}

/**
 * 从持久化存储获取工具的 skillsPath
 */
function getToolSkillsPath(toolId: string): string {
    try {
        // 从持久化存储读取工具配置
        const toolConfig = getStorageToolConfig(toolId)
        
        if (toolConfig && toolConfig.skillsPath) {
            return toolConfig.skillsPath
        }
        
        console.error(`[GetToolSkillsPath] 工具 ${toolId} 的 skillsPath 未找到`)
        return ''
    } catch (error) {
        console.error(`[GetToolSkillsPath] 读取配置失败:`, error)
        return ''
    }
}

/**
 * 切换 Skill 状态
 */
async function toggleSkill(toolId: string, skillName: string, enabled: boolean): Promise<boolean> {
    const skillsManagerDir = getSkillsManagerDir()
    
    if (!skillsManagerDir) {
        console.error(`[ToggleSkill] Skills 管理目录不存在`)
        return false
    }
    
    // 从持久化存储获取工具的 skillsPath
    const toolSkillsDir = getToolSkillsPath(toolId)
    
    if (!toolSkillsDir) {
        console.error(`[ToggleSkill] 工具 ${toolId} 的 skillsPath 未找到`)
        return false
    }
    
    const sourceSkillDir = join(skillsManagerDir, skillName)
    const targetSkillDir = join(toolSkillsDir, skillName)
    
    try {
        if (enabled) {
            // 启用：拷贝 skill 目录到工具的 skills 目录
            console.log(`[ToggleSkill] 启用 ${skillName} for ${toolId}`)
            console.log(`[ToggleSkill] 源目录: ${sourceSkillDir}`)
            console.log(`[ToggleSkill] 目标目录: ${targetSkillDir}`)
            
            // 确保源目录存在
            if (!fs.existsSync(sourceSkillDir)) {
                console.error(`[ToggleSkill] 源 Skill 目录不存在: ${sourceSkillDir}`)
                return false
            }
            
            // 确保目标 skills 目录存在
            if (!fs.existsSync(toolSkillsDir)) {
                await fs.promises.mkdir(toolSkillsDir, { recursive: true })
            }
            
            // 拷贝目录
            await copyDirectory(sourceSkillDir, targetSkillDir)
            console.log(`[ToggleSkill] 拷贝成功`)
        } else {
            // 禁用：删除工具 skills 目录下的 skill
            console.log(`[ToggleSkill] 禁用 ${skillName} for ${toolId}`)
            console.log(`[ToggleSkill] 删除目录: ${targetSkillDir}`)
            
            if (fs.existsSync(targetSkillDir)) {
                await fs.promises.rm(targetSkillDir, { recursive: true, force: true })
                console.log(`[ToggleSkill] 删除成功`)
            }
        }
        
        // 更新配置
        const config = await getToolConfig(toolId)
        config.skills[skillName] = enabled
        await saveToolConfig(toolId, config)
        
        return true
    } catch (error) {
        console.error(`[ToggleSkill] 操作失败:`, error)
        return false
    }
}

/**
 * 递归拷贝目录
 */
async function copyDirectory(source: string, target: string): Promise<void> {
    // 创建目标目录
    await fs.promises.mkdir(target, { recursive: true })
    
    // 读取源目录
    const items = await fs.promises.readdir(source, { withFileTypes: true })
    
    for (const item of items) {
        const sourcePath = join(source, item.name)
        const targetPath = join(target, item.name)
        
        if (item.isDirectory()) {
            // 递归拷贝子目录
            await copyDirectory(sourcePath, targetPath)
        } else {
            // 拷贝文件
            await fs.promises.copyFile(sourcePath, targetPath)
        }
    }
}

/**
 * 切换工具开关
 */
async function toggleTool(toolId: string, enabled: boolean): Promise<boolean> {
    try {
        const config = await getToolConfig(toolId)
        
        if (enabled) {
            // 开启工具：将所有已启用的 skills 拷贝过去
            console.log(`[ToggleTool] 开启工具: ${toolId}`)
            
            for (const [skillName, skillEnabled] of Object.entries(config.skills)) {
                if (skillEnabled) {
                    await toggleSkill(toolId, skillName, true)
                }
            }
        } else {
            // 关闭工具：删除所有 skills
            console.log(`[ToggleTool] 关闭工具: ${toolId}`)
            
            for (const skillName of Object.keys(config.skills)) {
                await toggleSkill(toolId, skillName, false)
            }
        }
        
        // 更新配置
        config.enabled = enabled
        await saveToolConfig(toolId, config)
        
        return true
    } catch (error) {
        console.error(`[ToggleTool] 操作失败:`, error)
        return false
    }
}
