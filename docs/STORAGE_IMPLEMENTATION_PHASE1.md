# 持久化存储实现 - Phase 1

## 已完成的工作

### 1. 后端存储模块
✅ 创建 `src/main/storage/index.ts`
- 实现了数据目录管理
- 实现了 JSON 文件读写（UTF-8 编码）
- 提供了默认配置
- 实现了以下核心函数：
  - `initStorage()` - 初始化存储系统
  - `getAppSettings()` / `saveAppSettings()` - 应用设置
  - `getToolsState()` / `saveToolsState()` - 工具状态
  - `getToolConfig()` / `saveToolConfig()` - 单个工具配置
  - `updateToolEnabled()` - 更新工具启用状态
  - `updateToolSkills()` - 更新 Skills 启用状态

### 2. IPC 通信层
✅ 创建 `src/main/ipc/storage.ts`
- 注册了所有存储相关的 IPC 处理函数
- 提供了 8 个 IPC 接口

### 3. Preload 层
✅ 更新 `src/preload/index.ts`
- 添加了存储 API 到 window.api
- 提供了 8 个前端可调用的方法

✅ 更新 `src/preload/index.d.ts`
- 添加了完整的 TypeScript 类型定义

### 4. Main Process 集成
✅ 更新 `src/main/index.ts`
- 导入存储模块
- 应用启动时调用 `initStorage()`
- 注册存储 IPC 处理函数

### 5. 设计文档
✅ 创建 `docs/STORAGE_PERSISTENCE_DESIGN.md`
- 完整的存储需求分析
- 数据结构设计
- 实现方案
- 数据流程说明

## 数据存储位置

Windows 系统下，数据存储在：
```
C:\Users\[用户名]\AppData\Roaming\skills-manager-app\data\
├── app-settings.json      # 应用全局设置
└── tools-state.json       # 工具状态数据
```

## 下一步工作（Phase 2）

### 1. 更新设置页面（Settings.vue）
- [ ] 组件挂载时加载配置
- [ ] 绑定所有设置项到响应式数据
- [ ] 实现保存功能
- [ ] 添加加载状态提示

### 2. 更新工具页面（Tools.vue）
- [ ] 组件挂载时加载工具状态
- [ ] 切换工具开关时自动保存
- [ ] 修改 Skills 选择时自动保存
- [ ] 合并现有的工具检测逻辑

### 3. 数据迁移
- [ ] 从 localStorage 迁移 Gemini API Key
- [ ] 从旧的 data/kiro.json 迁移到新结构

### 4. 测试验证
- [ ] 测试配置保存和加载
- [ ] 测试应用重启后配置恢复
- [ ] 测试错误处理

## 技术要点

### 编码规范
- 所有文件读写使用 UTF-8 编码
- 使用 `fs.readFileSync(path, 'utf8')`
- 使用 `fs.writeFileSync(path, data, 'utf8')`

### 错误处理
- 文件不存在时使用默认配置
- 读取失败时记录日志并返回默认值
- 写入失败时记录错误但不中断程序

### 数据格式
- 使用 JSON 格式存储
- 包含 version 字段用于未来迁移
- 使用 2 空格缩进格式化

## 使用示例

### 前端调用示例

```typescript
// 获取应用设置
const settings = await window.api.getAppSettings()

// 保存应用设置
await window.api.saveAppSettings(settings)

// 更新工具启用状态
await window.api.updateToolEnabled('kiro', true)

// 更新 Skills 启用状态
await window.api.updateToolSkills('kiro', 'skill-creator', true)
```

### 后端调用示例

```typescript
import { getAppSettings, saveAppSettings } from './storage'

// 获取设置
const settings = getAppSettings()

// 修改设置
settings.general.autoSync = false

// 保存设置
saveAppSettings(settings)
```
