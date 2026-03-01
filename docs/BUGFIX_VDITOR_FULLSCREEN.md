# Vditor 全屏功能修复

## 问题描述
在 Electron 应用中使用 Vditor 编辑器时，点击全屏按钮后：
- 无法退出全屏模式
- 工具栏按钮无法点击
- 整个编辑器界面被锁定

## 根本原因
Vditor 的全屏模式在 Electron 环境中存在 z-index 层级冲突问题：
1. 全屏容器的 z-index 默认值不够高，被其他元素覆盖
2. 工具栏的 pointer-events 可能被禁用
3. Electron 的窗口层级管理与浏览器不同

## 解决方案

### 1. 配置 Vditor 全屏 z-index
在 Vditor 初始化选项中设置全屏模式的 z-index 为极高值：

```typescript
const VDITOR_OPTS = {
  // ...其他配置
  fullscreen: {
    index: 999999 // 设置全屏模式的 z-index 为极高值
  }
}
```

### 2. 添加全局样式强化层级
添加全局 CSS 样式确保全屏模式下所有元素可交互，并覆盖应用布局：

```css
/* 全屏容器 - 使用极高 z-index 和视口单位 */
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

/* 工具栏 - 更高的 z-index */
.vditor--fullscreen .vditor-toolbar {
  z-index: 1000000 !important;
  pointer-events: auto !important;
  position: relative !important;
  background: #f5f5f5 !important;
}

/* 工具栏按钮 - 逐级提高 z-index */
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

/* 隐藏应用标题栏（当 Vditor 全屏时）*/
body:has(.vditor--fullscreen) .title-bar {
  display: none !important;
}

body:has(.vditor--fullscreen) .app-layout {
  z-index: 0 !important;
}
```

### 3. 关键技术点
- **使用 100vw/100vh**：确保全屏覆盖整个视口，而不是父容器
- **z-index 分层**：工具栏 > 按钮 > 内容，确保点击优先级
- **隐藏标题栏**：使用 `:has()` 选择器在全屏时隐藏应用标题栏
- **pointer-events: auto**：确保所有交互元素可点击
- **!important**：强制覆盖所有其他样式

## 修改的文件
- `src/renderer/src/views/SkillEditor.vue`
  - 在 `VDITOR_OPTS` 中添加 `fullscreen.index` 配置
  - 添加全局样式修复 z-index 和 pointer-events
  - 修复 `findFirstMd` 函数的 TypeScript 警告

## 验证步骤
1. 启动应用并打开 Skills 编辑器
2. 点击工具栏的全屏按钮（⛶ 图标）
3. 验证编辑器进入全屏模式
4. 验证工具栏所有按钮可以正常点击
5. 点击全屏按钮退出全屏模式
6. 验证编辑器恢复正常布局

## 技术要点
- 使用 **100vw/100vh** 而不是 100%，确保全屏覆盖整个视口
- z-index 使用 **999999+** 极高值，避免被任何元素覆盖
- z-index **分层设置**：工具栏(1000000) > 按钮(1000002) > 内容(999998)
- 使用 **:has()** 选择器在全屏时隐藏应用标题栏
- `pointer-events: auto` 确保所有交互元素可点击
- `position: fixed` 确保全屏容器脱离文档流
- 所有样式使用 **!important** 确保优先级最高

## 相关问题
- Vditor 在 Electron 中的全屏模式需要特殊处理
- 必须同时设置配置项和 CSS 样式才能完全解决问题
- 如果仍有问题，可以尝试提高 z-index 值（如 999999）
