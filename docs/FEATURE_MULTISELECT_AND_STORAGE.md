# 功能更新 - 多选模式和持久化存储

## 更新时间
2026-02-28

## 新增功能

### 1. 多选模式

Skills 列表弹窗新增多选模式，支持批量操作：

#### 功能特性
- ✅ 多选模式切换按钮
- ✅ 全选/取消全选
- ✅ 批量启用选中的 Skills
- ✅ 批量禁用选中的 Skills
- ✅ 选中状态视觉反馈（黄色高亮）
- ✅ 工具栏显示选中数量

#### 使用流程
1. 点击"多选模式"按钮进入多选模式
2. 点击卡片或复选框选择 Skills
3. 使用工具栏的"全选"、"启用选中"、"禁用选中"按钮
4. 点击"退出多选"返回普通模式

### 2. 优化的卡片布局

#### 新布局结构
```
┌─────────────────────────────────────────┐
│ [复选框] Skill 名称          [开关]     │
│          Skill 描述                     │
└─────────────────────────────────────────┘
```

#### 改进点
- ❌ 移除左侧图标（节省空间）
- ✅ 上下两行布局
  - 第一行：Skill 名称（加粗）
  - 第二行：Skill 描述（灰色，小字）
- ✅ 右侧使用滑动开关替代按钮
- ✅ 多选模式下显示复选框

### 3. Skill 描述支持

#### 后端修改
- `getToolSkills` 现在返回包含描述的 Skills
- 从 SKILL.MD 文件读取描述信息

#### 前端修改
- Skill 接口新增 `desc` 字段
- 卡片显示描述信息

## 持久化存储设计

### 存储位置
`程序目录/data/`

### 文件结构

#### 1. 全局配置：`data/tools-config.json`
```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-02-28T10:30:00Z",
  "skillsPath": "E:\\AITools\\SKillsManager\\Skills",
  "tools": {
    "gemini": {
      "enabled": true,
      "lastModified": "2026-02-28T10:30:00Z"
    }
  }
}
```

#### 2. 工具 Skills 配置：`data/{toolId}-skills.json`
```json
{
  "toolId": "gemini",
  "toolName": "Gemini",
  "version": "1.0.0",
  "lastUpdated": "2026-02-28T10:30:00Z",
  "skills": {
    "api-tester": {
      "enabled": true,
      "enabledAt": "2026-02-28T10:30:00Z"
    },
    "code-reviewer": {
      "enabled": false,
      "enabledAt": null
    }
  }
}
```

### 当前实现状态

#### ✅ 已实现
- 基本的配置读写（`getToolConfig`, `saveToolConfig`）
- Skills 状态持久化
- 工具开关状态持久化

#### 🚧 待实现
- 新的存储格式迁移
- 全局配置文件管理
- 时间戳记录
- 配置文件版本管理

## UI 变更

### 弹窗头部
- 新增"多选模式"按钮
- 按钮组：[多选模式] [关闭]

### 多选工具栏（仅多选模式显示）
- [全选] | [启用选中 (N)] [禁用选中 (N)]
- 按钮禁用状态：未选中时禁用操作按钮

### Skills 卡片
- 普通模式：名称 + 描述 + 开关
- 多选模式：复选框 + 名称 + 描述
- 状态样式：
  - 已启用：蓝色边框和背景
  - 已选中：黄色边框和背景

## 技术实现

### 前端状态管理
```typescript
const isMultiSelectMode = ref(false)  // 多选模式
const selectedSkills = ref<Set<string>>(new Set())  // 选中的 Skills
```

### 核心函数
- `toggleMultiSelectMode()`: 切换多选模式
- `toggleSkillSelection(skillName)`: 切换选中状态
- `toggleSelectAll()`: 全选/取消全选
- `batchEnableSelected()`: 批量启用
- `batchDisableSelected()`: 批量禁用

### 样式类
- `.skill-card.skill-selected`: 选中状态
- `.multi-select-toolbar`: 多选工具栏
- `.skill-checkbox`: 复选框容器
- `.toggle-switch`: 滑动开关

## 用户体验优化

### 视觉反馈
1. 多选模式按钮高亮显示当前状态
2. 选中的卡片黄色高亮
3. 已启用的卡片蓝色高亮
4. 工具栏按钮显示选中数量
5. 未选中时禁用操作按钮

### 交互优化
1. 多选模式下点击卡片即可选中
2. 退出多选模式自动清空选择
3. 批量操作后自动退出多选模式
4. 滑动开关提供即时反馈

## 测试要点

### 功能测试
- [ ] 进入/退出多选模式
- [ ] 全选/取消全选
- [ ] 单个选择/取消选择
- [ ] 批量启用（只启用未启用的）
- [ ] 批量禁用（只禁用已启用的）
- [ ] 普通模式下的开关切换
- [ ] Skills 描述正确显示

### 视觉测试
- [ ] 多选模式按钮状态
- [ ] 选中状态高亮
- [ ] 启用状态高亮
- [ ] 工具栏按钮禁用状态
- [ ] 滑动开关动画

### 持久化测试
- [ ] 配置保存和加载
- [ ] 重启后状态保持
- [ ] 多个工具独立配置

## 后续优化

### 短期
1. 实现新的存储格式
2. 添加操作成功提示
3. 添加加载动画
4. 优化批量操作性能

### 长期
1. 支持 Skills 搜索和过滤
2. 支持 Skills 排序
3. 支持 Skills 分组
4. 添加操作历史记录
5. 支持配置导入导出

## 相关文件

### 修改的文件
- `src/renderer/src/views/Tools.vue`: 添加多选模式和新 UI
- `src/main/ipc/skills.ts`: 返回 Skills 描述
- `src/preload/index.d.ts`: 更新类型定义

### 新增的文件
- `STORAGE_DESIGN.md`: 持久化存储设计文档
- `FEATURE_MULTISELECT_AND_STORAGE.md`: 本文档

## 总结

本次更新大幅提升了 Skills 管理的效率和用户体验：
- ✅ 多选模式支持批量操作
- ✅ 优化的卡片布局更清晰
- ✅ Skills 描述提供更多信息
- ✅ 滑动开关更直观
- 📋 持久化存储设计完成（待实现）

所有核心功能已实现，可以进行测试和使用！
