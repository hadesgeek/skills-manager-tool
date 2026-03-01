<template>
  <div class="editor-page">
    <!-- Left Sidebar: File Tree -->
    <div class="editor-sidebar-container">
      <div class="file-tree">
        <div class="tree-item root-item" @click="toggleDir(skillPath)">
          <span class="expand-arrow">{{ expandedDirs.has(skillPath) ? '▼' : '▶' }}</span>
          <span class="folder-icon">📂</span>
          <span class="label">{{ skillName }}</span>
        </div>
        <template v-if="expandedDirs.has(skillPath)">
          <TreeNode
            v-for="node in fileTree"
            :key="node.path"
            :node="node"
            :depth="1"
            :expanded-dirs="expandedDirs"
            :active-file-path="activeFilePath"
            @toggle-dir="toggleDir"
            @file-click="handleFileClick"
          />
        </template>
      </div>
    </div>

    <!-- Main Area -->
    <div class="editor-main-container">
      <header class="editor-header">
        <div class="editor-nav">
          <router-link to="/skills-manager" class="back-link">← 返回</router-link>
          <span class="breadcrumb">{{ skillName }}</span>
          <span v-if="activeFileName" class="breadcrumb-file">/ {{ activeFileName }}</span>
        </div>
        <button class="save-btn">💾 保存</button>
      </header>

      <!-- Empty State -->
      <div v-if="!activeFilePath" class="empty-state">请从左侧选择一个文件</div>

      <!-- Markdown dual-pane -->
      <div v-else-if="isMarkdown" class="dual-editor">
        <div class="editor-pane source-pane" :style="{ width: leftPaneWidth + '%' }">
          <div class="pane-header"><span>Source (Markdown)</span></div>
          <div class="pane-content">
            <div v-if="!sourceVdReady" class="editor-loading">加载中...</div>
            <div ref="sourceVditorEl" class="vditor-preview-box" :class="{ 'editor-hidden': !sourceVdReady }"></div>
          </div>
        </div>
        <div class="resizer" @mousedown="startResize"></div>
        <div class="editor-pane translation-pane" :style="{ width: (100 - leftPaneWidth) + '%' }">
          <div class="pane-header">
            <span>Translation (Chinese)</span>
            <div v-if="isTranslating" class="translating-badge">Gemini 翻译中...</div>
          </div>
          <div class="pane-content">
            <div v-if="!targetVdReady" class="editor-loading">加载中...</div>
            <div ref="targetVditorEl" class="vditor-preview-box" :class="{ 'editor-hidden': !targetVdReady }"></div>
          </div>
        </div>
      </div>

      <!-- Code Editor (non-MD files, single pane) -->
      <div v-else class="code-editor-wrapper">
        <div class="pane-header code-header">
          <span>{{ activeFileName }}</span>
          <span class="code-lang-tag">{{ codeLang }}</span>
        </div>
        <div ref="codeEditorEl" class="code-editor"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, defineComponent, h } from 'vue'
import { useRoute } from 'vue-router'
import Vditor from 'vditor'
import 'vditor/dist/index.css'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { python } from '@codemirror/lang-python'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { oneDark } from '@codemirror/theme-one-dark'
import { logger } from '../utils/logger'

const route = useRoute()

const skillPath = ref(route.query.path as string || '')
const skillName = ref(route.query.name as string || 'Unknown Skill')

// ---- Helpers ----
function isMdFile(name: string) { return name.toLowerCase().endsWith('.md') }
function isCnMdFile(name: string) { return name.toLowerCase().endsWith('_cn.md') }

// ---- File Node Interface ----
interface FileNode {
  name: string
  path: string
  isDirectory: boolean
  children?: FileNode[]
}

// ---- Recursive TreeNode Component ----
const TreeNode = defineComponent({
  name: 'TreeNode',
  props: {
    node: { type: Object as () => FileNode, required: true },
    depth: { type: Number, required: true },
    expandedDirs: { type: Object as () => Set<string>, required: true },
    activeFilePath: { type: String, required: true }
  },
  emits: ['toggleDir', 'fileClick'],
  setup(props, { emit }) {
    const isExpanded = computed(() => props.expandedDirs.has(props.node.path))
    const pl = computed(() => `${props.depth * 14 + 4}px`)

    return () => {
      if (isCnMdFile(props.node.name)) return null
      if (props.node.isDirectory) {
        return h('div', {}, [
          h('div', { class: 'tree-item', style: { paddingLeft: pl.value }, onClick: () => emit('toggleDir', props.node.path) }, [
            h('span', { class: 'expand-arrow' }, isExpanded.value ? '▼' : '▶'),
            h('span', { class: 'folder-icon' }, '📂'),
            h('span', { class: 'label' }, props.node.name)
          ]),
          isExpanded.value && props.node.children
            ? h('div', {}, props.node.children.map(child =>
                h(TreeNode, {
                  key: child.path, node: child, depth: props.depth + 1,
                  expandedDirs: props.expandedDirs, activeFilePath: props.activeFilePath,
                  onToggleDir: (p: string) => emit('toggleDir', p),
                  onFileClick: (n: FileNode) => emit('fileClick', n)
                })
              ))
            : null
        ])
      } else {
        const icon = isMdFile(props.node.name) ? '📝' : '📄'
        return h('div', {
          class: ['tree-item', props.activeFilePath === props.node.path ? 'active-file' : ''],
          style: { paddingLeft: pl.value },
          onClick: () => emit('fileClick', props.node)
        }, [
          h('span', { class: 'file-icon' }, icon),
          h('span', { class: 'label' }, props.node.name)
        ])
      }
    }
  }
})

// ---- State ----
const fileTree = ref<FileNode[]>([])
const expandedDirs = ref<Set<string>>(new Set())
const activeFilePath = ref('')
const activeFileName = ref('')
const sourceContent = ref('')
const targetContent = ref('')
const isTranslating = ref(false)

const isMarkdown = computed(() => isMdFile(activeFilePath.value) && !isCnMdFile(activeFilePath.value))


const sourceVditorEl = ref<HTMLDivElement | null>(null)
const targetVditorEl = ref<HTMLDivElement | null>(null)
const codeEditorEl = ref<HTMLElement | null>(null)
let codeEditorView: EditorView | null = null

const codeLang = computed(() => {
  const ext = activeFilePath.value.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = { py: 'Python', js: 'JavaScript', ts: 'TypeScript', json: 'JSON', sh: 'Shell', txt: 'Text', yaml: 'YAML', yml: 'YAML' }
  return map[ext] || ext.toUpperCase()
})

// ---- Resizer State ----
const leftPaneWidth = ref(50) // 左侧面板宽度百分比
const isResizing = ref(false)

function startResize(e: MouseEvent) {
  isResizing.value = true
  const startX = e.clientX
  const startWidth = leftPaneWidth.value

  const onMouseMove = (moveEvent: MouseEvent) => {
    if (!isResizing.value) return
    const container = (moveEvent.target as HTMLElement).closest('.dual-editor') as HTMLElement
    if (!container) return
    
    const containerRect = container.getBoundingClientRect()
    const deltaX = moveEvent.clientX - startX
    const deltaPercent = (deltaX / containerRect.width) * 100
    
    // 限制在 20% 到 80% 之间
    let newWidth = startWidth + deltaPercent
    newWidth = Math.max(20, Math.min(80, newWidth))
    leftPaneWidth.value = newWidth
  }

  const onMouseUp = () => {
    isResizing.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function getCodeMirrorLang(ext: string) {
  if (ext === 'py') return python()
  if (['js', 'ts', 'mjs'].includes(ext)) return javascript({ typescript: ext === 'ts' })
  if (ext === 'json') return json()
  return []
}

// ---- Vditor Instance Management ----
let sourceVd: Vditor | null = null
let targetVd: Vditor | null = null
let pendingTargetContent: string | null = null // Holds translation until source Vditor is ready
let sourceVdReady = false
const targetVdReady = ref(false) // 目标编辑器是否就绪

function destroyVditors() {
  sourceVdReady = false
  targetVdReady.value = false
  pendingTargetContent = null
  if (sourceVd) { try { sourceVd.destroy() } catch { } ; sourceVd = null }
  if (targetVd) { try { targetVd.destroy() } catch { } ; targetVd = null }
  if (sourceVditorEl.value) sourceVditorEl.value.innerHTML = ''
  if (targetVditorEl.value) targetVditorEl.value.innerHTML = ''
}

// Vditor 配置选项（保留供将来使用）
// const VDITOR_OPTS = {
//   mode: 'ir' as const, // 即时渲染模式
//   cdn: '/vditor',
//   cache: { enable: false },
//   toolbar: ['headings', 'bold', 'italic', 'strike', 'line', 'list', 'ordered-list',
//             'code', 'inline-code', 'table', 'fullscreen', 'edit-mode', 'code-theme', 'content-theme', 'preview'] as any[],
//   preview: { 
//     hljs: { style: 'github', lineNumber: true },
//     mode: 'both' // 同时显示编辑和预览
//   },
//   height: '100%',
//   fullscreen: {
//     index: 999999
//   },
//   typewriterMode: false,
//   placeholder: ''
// }

// 使用纯预览模式渲染（不使用编辑器）
function renderPreviewOnly(el: HTMLDivElement, content: string) {
  logger.info('[SkillEditor] 开始渲染预览', {
    contentLength: content.length,
    contentPreview: content.substring(0, 100)
  })
  
  try {
    el.innerHTML = ''
    
    // 处理 YAML frontmatter：将其转换为代码块而不是删除
    let processedContent = content
    const yamlMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/)
    if (yamlMatch) {
      const yamlContent = yamlMatch[1]
      const restContent = content.substring(yamlMatch[0].length)
      
      // 将 YAML frontmatter 转换为 YAML 代码块
      processedContent = `\`\`\`yaml\n${yamlContent}\n\`\`\`\n\n${restContent}`
      logger.info('[SkillEditor] 处理了 YAML frontmatter')
    }
    
    // 创建预览容器
    const previewContainer = document.createElement('div')
    previewContainer.className = 'vditor-preview-container'
    el.appendChild(previewContainer)
    
    logger.info('[SkillEditor] 预览容器已创建，准备调用 Vditor.preview')
    
    // 检查 Vditor 是否可用
    if (typeof Vditor === 'undefined') {
      logger.error('[SkillEditor] Vditor 未定义！')
      previewContainer.innerHTML = '<div style="color: red; padding: 20px;">错误：Vditor 库未加载</div>'
      return
    }
    
    // 检查 Vditor.preview 方法是否存在
    // @ts-ignore
    if (typeof Vditor.preview !== 'function') {
      logger.error('[SkillEditor] Vditor.preview 方法不存在！')
      previewContainer.innerHTML = '<div style="color: red; padding: 20px;">错误：Vditor.preview 方法不可用</div>'
      return
    }
    
    logger.info('[SkillEditor] 调用 Vditor.preview', {
      cdn: './vditor',
      processedContentLength: processedContent.length
    })
    
    // 使用 Vditor.preview 静态方法渲染
    // @ts-ignore
    Vditor.preview(previewContainer, processedContent, {
      cdn: './vditor',
      hljs: { style: 'github', lineNumber: true },
      mode: 'light'
    })
    
    logger.info('[SkillEditor] Vditor.preview 调用完成')
    
    // 检查渲染结果
    setTimeout(() => {
      const renderedContent = previewContainer.innerHTML
      logger.info('[SkillEditor] 渲染结果检查', {
        hasContent: renderedContent.length > 0,
        contentLength: renderedContent.length,
        preview: renderedContent.substring(0, 200)
      })
    }, 100)
    
  } catch (error) {
    logger.errorDetail('[SkillEditor] 渲染预览失败', error)
    el.innerHTML = `<div style="color: red; padding: 20px;">渲染失败：${error instanceof Error ? error.message : String(error)}</div>`
  }
}

function initTargetVditor(el: HTMLDivElement, content: string) {
  logger.info('[SkillEditor] 初始化目标编辑器（翻译面板）', {
    contentLength: content.length
  })
  
  targetVdReady.value = false
  
  try {
    // 直接使用预览模式渲染
    renderPreviewOnly(el, content)
    
    // 标记为就绪
    setTimeout(() => {
      targetVdReady.value = true
      logger.info('[SkillEditor] 目标编辑器标记为就绪')
    }, 50)
  } catch (error) {
    logger.errorDetail('[SkillEditor] 初始化目标编辑器失败', error)
  }
}

function initSourceVditor(el: HTMLDivElement, content: string) {
  logger.info('[SkillEditor] 初始化源编辑器（原文面板）', {
    contentLength: content.length
  })
  
  try {
    // 直接使用预览模式渲染
    renderPreviewOnly(el, content)
    
    sourceVdReady = true
    logger.info('[SkillEditor] 源编辑器标记为就绪')
    
    if (pendingTargetContent && targetVditorEl.value) {
      logger.info('[SkillEditor] 处理待渲染的翻译内容')
      initTargetVditor(targetVditorEl.value, pendingTargetContent)
      pendingTargetContent = null
    }
  } catch (error) {
    logger.errorDetail('[SkillEditor] 初始化源编辑器失败', error)
  }
}

// Source content watch: destroy both, then init source Vditor
watch(sourceContent, () => {
  logger.info('[SkillEditor] sourceContent 变化', {
    isMarkdown: isMarkdown.value,
    hasContent: !!sourceContent.value,
    contentLength: sourceContent.value.length,
    hasSourceEl: !!sourceVditorEl.value
  })
  
  if (!isMarkdown.value || !sourceContent.value || !sourceVditorEl.value) {
    logger.warn('[SkillEditor] 跳过源编辑器初始化', {
      isMarkdown: isMarkdown.value,
      hasContent: !!sourceContent.value,
      hasSourceEl: !!sourceVditorEl.value
    })
    return
  }
  
  destroyVditors()
  initSourceVditor(sourceVditorEl.value, sourceContent.value)
}, { flush: 'post' })

// Target content watch: init target only after source Vditor is ready (Lute loaded)
watch(targetContent, () => {
  logger.info('[SkillEditor] targetContent 变化', {
    isMarkdown: isMarkdown.value,
    hasContent: !!targetContent.value,
    contentLength: targetContent.value.length,
    hasTargetVd: !!targetVd,
    sourceVdReady: sourceVdReady
  })
  
  if (!isMarkdown.value || !targetContent.value) {
    logger.warn('[SkillEditor] 跳过目标编辑器初始化', {
      isMarkdown: isMarkdown.value,
      hasContent: !!targetContent.value
    })
    return
  }
  
  if (targetVd) {
    // Already exists, just update value
    logger.info('[SkillEditor] 更新现有目标编辑器内容')
    targetVd.setValue(targetContent.value)
  } else if (sourceVdReady && targetVditorEl.value) {
    // Source is ready, safe to init target immediately
    logger.info('[SkillEditor] 源编辑器已就绪，立即初始化目标编辑器')
    initTargetVditor(targetVditorEl.value, targetContent.value)
  } else {
    // Source still initializing — store content to be used in after() callback
    logger.info('[SkillEditor] 源编辑器未就绪，暂存翻译内容')
    pendingTargetContent = targetContent.value
  }
}, { flush: 'post' })

watch([isMarkdown, activeFilePath, sourceContent], () => {
  if (isMarkdown.value) return
  destroyVditors()
  // 等待 DOM 更新后再初始化编辑器
  setTimeout(() => initCodeEditor(), 50)
}, { flush: 'post' })


function initCodeEditor() {
  if (!codeEditorEl.value || !sourceContent.value) return
  if (codeEditorView) { 
    try { codeEditorView.destroy() } catch {}
    codeEditorView = null 
  }
  
  // 清空容器
  codeEditorEl.value.innerHTML = ''
  
  const ext = activeFilePath.value.split('.').pop()?.toLowerCase() || ''
  const state = EditorState.create({
    doc: sourceContent.value,
    extensions: [basicSetup, oneDark, getCodeMirrorLang(ext) as any]
  })
  codeEditorView = new EditorView({ state, parent: codeEditorEl.value })
}

// ---- Tree ops ----
function toggleDir(path: string) {
  const s = new Set(expandedDirs.value)
  s.has(path) ? s.delete(path) : s.add(path)
  expandedDirs.value = s
}

async function loadDirTree() {
  if (!skillPath.value) {
    logger.warn('[SkillEditor] skillPath 为空，无法加载目录树')
    return
  }
  
  logger.info('[SkillEditor] 加载目录树', { skillPath: skillPath.value })
  
  try {
    // @ts-ignore
    const tree = await window.api.readDirTree(skillPath.value)
    
    if (tree?.children) {
      fileTree.value = tree.children
      expandedDirs.value = new Set([skillPath.value])
      
      logger.info('[SkillEditor] 目录树加载成功', {
        childrenCount: tree.children.length
      })
      
      const defaultFile = findFirstMd(tree.children, 'skill.md') || findFirstMd(tree.children)
      if (defaultFile) {
        logger.info('[SkillEditor] 找到默认文件', { path: defaultFile.path })
        handleFileClick(defaultFile)
      } else {
        logger.warn('[SkillEditor] 未找到默认 Markdown 文件')
      }
    } else {
      logger.warn('[SkillEditor] 目录树为空或无 children')
    }
  } catch (error) {
    logger.errorDetail('[SkillEditor] 加载目录树失败', error)
  }
}

function findFirstMd(nodes: FileNode[], exact?: string): FileNode | undefined {
  for (const n of nodes) {
    if (!n.isDirectory && !isCnMdFile(n.name)) {
      if (exact ? n.name.toLowerCase() === exact : isMdFile(n.name)) return n
    }
    if (n.isDirectory && n.children) {
      const f = findFirstMd(n.children, exact)
      if (f) return f
    }
  }
  return undefined // 明确返回 undefined
}

async function handleFileClick(node: FileNode) {
  if (node.isDirectory) return
  
  logger.info('[SkillEditor] 文件点击', {
    path: node.path,
    name: node.name,
    isMarkdown: isMdFile(node.name)
  })
  
  activeFilePath.value = node.path
  activeFileName.value = node.name
  sourceContent.value = ''
  targetContent.value = ''

  try {
    // @ts-ignore
    const content = await window.api.readFile(node.path)
    sourceContent.value = content ?? ''
    
    logger.info('[SkillEditor] 文件读取成功', {
      path: node.path,
      contentLength: sourceContent.value.length,
      contentPreview: sourceContent.value.substring(0, 100)
    })

    // Only MD files trigger translation check
    if (isMdFile(node.name) && !isCnMdFile(node.name)) {
      logger.info('[SkillEditor] 这是 Markdown 文件，检查翻译')
      checkOrTranslate(node.path)
    }
  } catch (error) {
    logger.errorDetail('[SkillEditor] 读取文件失败', error)
    sourceContent.value = `读取文件失败：${error instanceof Error ? error.message : String(error)}`
  }
}

async function checkOrTranslate(filePath: string) {
  logger.info('[SkillEditor] 检查翻译文件', { filePath })
  
  const extIndex = filePath.lastIndexOf('.')
  const base = extIndex !== -1 ? filePath.substring(0, extIndex) : filePath
  const ext  = extIndex !== -1 ? filePath.substring(extIndex) : '.md'
  const cnPath = `${base}_cn${ext}`
  
  logger.info('[SkillEditor] 翻译文件路径', { cnPath })
  
  try {
    // @ts-ignore
    const cached: string | null = await window.api.readFile(cnPath)
    if (cached !== null) {
      logger.info('[SkillEditor] 找到缓存的翻译文件', {
        contentLength: cached.length
      })
      targetContent.value = cached
    } else {
      logger.info('[SkillEditor] 未找到翻译文件，触发翻译')
      triggerTranslation(filePath)
    }
  } catch (error) {
    logger.errorDetail('[SkillEditor] 检查翻译文件失败', error)
    triggerTranslation(filePath)
  }
}

async function triggerTranslation(filePath: string) {
  // @ts-ignore
  const settings = await window.api.getAppSettings()
  const apiKey = settings?.ai?.geminiApiKey || ''
  if (!apiKey) { targetContent.value = '错误: 请先在设置页面配置 Gemini API Key。'; return }
  isTranslating.value = true
  try {
    // @ts-ignore
    targetContent.value = await window.api.translateAndSave(filePath, apiKey)
  } catch (e: any) {
    targetContent.value = `翻译失败: ${e.message}`
  } finally {
    isTranslating.value = false
  }
}

onMounted(() => {
  logger.info('[SkillEditor] 组件已挂载', {
    skillPath: skillPath.value,
    skillName: skillName.value
  })
  
  // 检查 Vditor 是否已加载
  logger.info('[SkillEditor] Vditor 加载状态', {
    vditorDefined: typeof Vditor !== 'undefined',
    // @ts-ignore
    vditorPreviewExists: typeof Vditor !== 'undefined' && typeof Vditor.preview === 'function'
  })
  
  loadDirTree()
})
</script>

<style scoped>
.editor-page {
  height: 100%;
  display: flex;
  background: #FFFFFF;
  overflow: hidden;
}

.editor-sidebar-container {
  width: 220px;
  background: #F8F9FA;
  border-right: 1px solid #E5E7EB;
  overflow-y: auto;
  flex-shrink: 0;
}

.file-tree {
  padding: 12px 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tree-item {
  display: flex;
  align-items: center;
  min-height: 28px;
  border-radius: 4px;
  cursor: pointer;
  padding: 0 4px;
  gap: 4px;
}

.root-item { padding: 0 6px; margin-bottom: 4px; }
.tree-item:hover { background: rgba(0,0,0,0.04); }
.active-file { background: #EEF2FF; }

.expand-arrow { font-size: 9px; color: #9CA3AF; width: 10px; flex-shrink: 0; }
.folder-icon, .file-icon { font-size: 13px; flex-shrink: 0; }
.label {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #6B7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.root-item .label { font-weight: 600; color: #1F2937; font-size: 13px; }
.active-file .label { color: #6366F1; font-weight: 500; }

.editor-main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-header {
  height: 52px;
  padding: 0 20px;
  border-bottom: 1px solid #E5E7EB;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.editor-nav { display: flex; align-items: center; gap: 8px; }
.back-link { font-family: 'Inter', sans-serif; font-size: 13px; color: #6B7280; text-decoration: none; }
.back-link:hover { color: #1F2937; }
.breadcrumb { font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; color: #1F2937; }
.breadcrumb-file { font-family: 'Inter', sans-serif; font-size: 13px; color: #9CA3AF; }

.save-btn {
  height: 36px; padding: 0 16px; background: #6366F1; color: #FFF;
  border-radius: 8px; font-family: 'Inter', sans-serif; font-size: 13px;
  font-weight: 500; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px;
  transition: all 0.2s;
}
.save-btn:hover { background: #4F46E5; }

.empty-state {
  flex: 1; display: flex; justify-content: center; align-items: center;
  font-family: 'Inter', sans-serif; font-size: 14px; color: #9CA3AF;
}

.dual-editor { flex: 1; display: flex; overflow: hidden; }
.editor-pane { display: flex; flex-direction: column; overflow: hidden; }

.resizer {
  width: 4px;
  background: #E5E7EB;
  cursor: col-resize;
  flex-shrink: 0;
  position: relative;
  transition: background 0.2s;
}

.resizer:hover {
  background: #6366F1;
}

.resizer::before {
  content: '';
  position: absolute;
  left: -2px;
  right: -2px;
  top: 0;
  bottom: 0;
}

.pane-header {
  height: 36px;
  background: #F8F9FA;
  border-bottom: 1px solid #E5E7EB;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px; flex-shrink: 0;
}
.pane-header span { font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500; color: #6B7280; }

.translating-badge {
  font-family: 'Inter', sans-serif; font-size: 11px; color: #6366F1;
  background: #EEF2FF; padding: 2px 8px; border-radius: 4px;
}

.pane-content { flex: 1; overflow-y: auto; position: relative; }
.vditor-container { padding: 4px 8px; }

/* 编辑器加载状态 */
.editor-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #9CA3AF;
  z-index: 10;
}

.editor-hidden {
  opacity: 0;
  pointer-events: none;
}

.vditor-preview-box {
  transition: opacity 0.2s ease-in-out;
}

/* MD rendered output — Vditor's vditor-reset class provides typography */
.md-body { padding: 16px 20px; }

/* Code Editor */
.code-editor-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.code-header { justify-content: flex-start; gap: 12px; }
.code-lang-tag {
  font-family: 'Inter', sans-serif; font-size: 11px;
  background: #374151; color: #D1D5DB; padding: 2px 8px; border-radius: 4px;
}
.code-editor { flex: 1; overflow: auto; }
.code-editor :deep(.cm-editor) {
  height: 100%;
  font-size: 13px;
  font-family: 'Consolas', 'Monaco', 'JetBrains Mono', monospace;
}
.code-editor :deep(.cm-scroller) { overflow: auto; height: 100%; }
</style>

<style>
/* 全局样式：修复 Vditor 全屏模式的 z-index 问题 */
.vditor--fullscreen {
  z-index: 999999 !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  margin: 0 !important;
  padding: 0 !important;
  background: #fff !important;
}

.vditor--fullscreen .vditor-toolbar {
  z-index: 1000000 !important;
  pointer-events: auto !important;
  position: relative !important;
  background: #f5f5f5 !important;
}

.vditor--fullscreen .vditor-toolbar__item {
  pointer-events: auto !important;
  cursor: pointer !important;
  z-index: 1000001 !important;
}

.vditor--fullscreen .vditor-toolbar__item button {
  pointer-events: auto !important;
  cursor: pointer !important;
  z-index: 1000002 !important;
}

.vditor--fullscreen .vditor-toolbar__item:hover {
  background-color: rgba(0, 0, 0, 0.05) !important;
}

/* 确保全屏时工具栏可点击 */
.vditor-toolbar {
  position: relative;
  z-index: 100;
}

/* 确保全屏时内容区域正确显示 */
.vditor--fullscreen .vditor-content {
  z-index: 999998 !important;
  pointer-events: auto !important;
}

/* 确保全屏时编辑区域可交互 */
.vditor--fullscreen .vditor-ir {
  pointer-events: auto !important;
  cursor: text !important;
}

.vditor--fullscreen .vditor-preview {
  pointer-events: auto !important;
}

/* 确保全屏时遮罩层不会阻挡 */
.vditor--fullscreen::before,
.vditor--fullscreen::after {
  display: none !important;
}

/* 隐藏应用标题栏（当 Vditor 全屏时）*/
body:has(.vditor--fullscreen) .title-bar {
  display: none !important;
}

body:has(.vditor--fullscreen) .app-layout {
  z-index: 0 !important;
}

/* 修复预览模式下的布局问题 */
.vditor--preview .vditor-ir {
  display: none !important;
}

.vditor--preview .vditor-preview {
  display: block !important;
  width: 100% !important;
  flex: 1 !important;
}

.vditor--preview .vditor-content {
  display: flex !important;
  flex-direction: column !important;
}

/* 确保预览内容占满整个区域 */
.vditor-preview {
  width: 100% !important;
  padding: 16px 20px !important;
}

.vditor-preview__preview {
  width: 100% !important;
  max-width: 100% !important;
}

/* 纯预览容器样式 */
.vditor-preview-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  background: #fff;
}

.vditor-preview-container :deep(.vditor-reset) {
  width: 100% !important;
  max-width: 100% !important;
  padding: 0 !important;
}
</style>
