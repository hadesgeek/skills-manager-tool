# 持久化存储设计方案

## 一、存储需求分析

### 1. 设置页面需要存储的数据
- **通用设置**
  - Skills 存储目录路径
  - 默认编辑器选择
  - 自动同步开关
  - 同步通知开关
  
- **AI 配置**
  - Gemini API Key
  
- **市场配置**
  - GitHub Token
  - awesome-claude-skills 开关
  - skills.sh 开关
  
- **外观设置**
  - 主题选择（浅色/深色/跟随系统）
  - 界面语言（中文/English）

### 2. 工具页面需要存储的数据
- **工具状态**
  - 每个工具的启用/禁用状态
  - 每个工具的 Skills 启用状态（哪些 Skills 被选中）
  
- **自定义工具**
  - 用户添加的自定义工具配置

## 二、存储结构设计

### 文件组织
```
data/
├── app-settings.json      # 应用全局设置
├── tools-state.json       # 工具状态数据
└── [tool-id].json         # 每个工具的独立配置（如 kiro.json）
```

### 1. app-settings.json（应用全局设置）
```json
{
  "version": "1.0.0",
  "general": {
    "skillsDirectory": "E:\\AITools\\SKillsManager\\Skills",
    "defaultEditor": "built-in",
    "autoSync": true,
    "syncNotification": true
  },
  "ai": {
    "geminiApiKey": "AIzaSy..."
  },
  "market": {
    "githubToken": "",
    "enabledSources": {
      "awesome-claude-skills": true,
      "skills-sh": true
    }
  },
  "appearance": {
    "theme": "system",
    "language": "zh-CN"
  }
}
```

### 2. tools-state.json（工具状态）
```json
{
  "version": "1.0.0",
  "tools": {
    "kiro": {
      "enabled": true,
      "installed": true,
      "configPath": "C:\\Users\\...\\kiro\\config",
      "skillsPath": "C:\\Users\\...\\kiro\\skills",
      "enabledSkills": {
        "skill-creator": true,
        "api-tester": false,
        "code-reviewer": true
      }
    },
    "cursor": {
      "enabled": false,
      "installed": true,
      "configPath": "C:\\Users\\...\\cursor\\config",
      "skillsPath": "C:\\Users\\...\\cursor\\skills",
      "enabledSkills": {}
    }
  },
  "customTools": [
    {
      "id": "my-custom-tool",
      "name": "My Custom Tool",
      "dirName": ".my-tool",
      "enabled": false,
      "installed": false,
      "enabledSkills": {}
    }
  ]
}
```

## 三、实现方案

### 1. 后端（Main Process）实现

#### 创建存储管理模块
文件：`src/main/storage/index.ts`

功能：
- 读取/写入 JSON 文件
- 数据验证和迁移
- 默认值处理
- 错误处理

#### IPC 通信接口
- `storage:getAppSettings` - 获取应用设置
- `storage:saveAppSettings` - 保存应用设置
- `storage:getToolsState` - 获取工具状态
- `storage:saveToolsState` - 保存工具状态
- `storage:getToolConfig` - 获取单个工具配置
- `storage:saveToolConfig` - 保存单个工具配置

### 2. 前端（Renderer Process）实现

#### 设置页面
- 组件挂载时：从后端加载所有设置
- 用户修改时：实时更新本地状态
- 点击保存按钮：批量保存到后端

#### 工具页面
- 组件挂载时：加载工具状态和配置
- 切换工具开关：立即保存状态
- 修改 Skills 选择：立即保存配置
- 添加自定义工具：保存到 customTools

## 四、数据流程

### 启动流程
1. 应用启动
2. Main Process 检查 data 目录是否存在
3. 检查配置文件是否存在，不存在则创建默认配置
4. Renderer Process 请求加载配置
5. 显示界面，使用加载的配置

### 保存流程
1. 用户修改设置/状态
2. 前端调用 IPC 接口
3. 后端验证数据
4. 写入 JSON 文件（UTF-8 编码）
5. 返回成功/失败状态
6. 前端显示提示信息

### 同步机制
- 设置页面：手动保存（点击保存按钮）
- 工具页面：自动保存（每次操作后立即保存）

## 五、错误处理

### 文件读取失败
- 使用默认配置
- 记录错误日志
- 提示用户

### 文件写入失败
- 重试机制（最多 3 次）
- 显示错误提示
- 保留旧配置

### 数据格式错误
- 数据验证
- 自动修复或使用默认值
- 记录警告日志

## 六、迁移策略

### 版本升级
- 检查配置文件版本号
- 执行数据迁移脚本
- 保留旧配置备份

### 兼容性
- 向后兼容旧版本配置
- 自动补充缺失字段
- 清理废弃字段

## 七、实现优先级

### Phase 1（核心功能）
1. 创建存储管理模块
2. 实现基础 IPC 接口
3. 工具页面状态持久化
4. 设置页面基础配置持久化

### Phase 2（完善功能）
1. 错误处理和重试机制
2. 数据验证
3. 日志记录

### Phase 3（优化）
1. 性能优化
2. 数据迁移
3. 备份恢复
