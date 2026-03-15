/**
 * URL 检测工具模块
 * 用于检测 Skill 详情页 URL 并提取相关信息
 */

/**
 * Skill URL 信息接口
 */
export interface SkillUrlInfo {
  owner: string       // GitHub 仓库所有者
  repo: string        // GitHub 仓库名称
  skillName: string   // Skill 名称
  isDetailPage: boolean  // 是否为详情页
}

/**
 * Skill 详情页 URL 模式
 * 格式：https://skills.sh/[owner]/[repo]/[skill-name]
 * 示例：https://skills.sh/modelcontextprotocol/servers/filesystem
 */
const DETAIL_PAGE_PATTERN = /^https:\/\/skills\.sh\/([^\/]+)\/([^\/]+)\/([^\/]+)\/?$/

/**
 * 检测 URL 是否为 Skill 详情页
 * @param url - 要检测的 URL
 * @returns Skill URL 信息对象
 */
export function detectSkillDetailPage(url: string): SkillUrlInfo {
  const match = url.match(DETAIL_PAGE_PATTERN)
  
  if (!match) {
    return {
      owner: '',
      repo: '',
      skillName: '',
      isDetailPage: false
    }
  }
  
  return {
    owner: match[1],
    repo: match[2],
    skillName: match[3],
    isDetailPage: true
  }
}

/**
 * 构建 degit 源路径
 * @param info - Skill URL 信息对象
 * @returns degit 源路径，格式：[owner]/[repo]/[skillName]
 */
export function buildDegitSource(info: SkillUrlInfo): string {
  if (!info.isDetailPage) {
    return ''
  }
  
  return `${info.owner}/${info.repo}/${info.skillName}`
}
