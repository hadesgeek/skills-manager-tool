// 工具图标映射配置
// 根据工具 ID 映射到对应的图标文件

export const toolIconsMap: Record<string, string> = {
  'gemini': 'gemini.svg',
  'antigravity': 'antigravity.svg',
  'kiro': 'kiro.svg',
  'qoder': 'qoder.png',
  'claude-code': 'claude-code.svg',
  'codex': 'codex.svg',
  'codebuddy': 'codebuddy.svg',
  'opencode': 'opencode.svg',
  'cursor': 'cursor.svg',
  'windsurf': 'windsurf.svg',
  'trae': 'trae.svg',
  'droid': 'droid.svg',
  'augment': 'augment.svg',
  'openclaw': 'openclaw.svg',
  'cline': 'cline.svg',
  'vercel-skills': 'vercel-skills.svg',
  'commandcode': 'commandcode.svg',
  'continue': 'continue.png',
  'crush': 'crush.png',
  'goose': 'goose.svg',
  'iflow': 'iflow.svg',
  'junie': 'junie.svg',
  'kilo-code': 'kilo-code.jpeg',
  'qwen-code': 'qwen-code.svg',
  'roo-code': 'roo-code.jpeg',
  'zencoder': 'zencoder.jpeg',
  'pi': 'pi.png'
}

// 获取工具图标路径
export function getToolIconPath(toolId: string): string {
  const iconFile = toolIconsMap[toolId]
  if (iconFile) {
    return new URL(`../assets/tool-icons/${iconFile}`, import.meta.url).href
  }
  // 返回空字符串，没有图标
  return ''
}
