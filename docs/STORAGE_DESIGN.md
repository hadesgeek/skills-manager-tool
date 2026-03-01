# 工具页面持久化存储设计

## 存储位置

所有配置文件存储在：`程序目录/data/`

## 存储结构

### 1. 全局配置文件：`data/tools-config.json`

存储工具页面的全局配置：

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-02-28T10:30:00Z",
  "skillsPath": "E:\\AITools\\SKillsManager\\Skills",
  "tools": {
    "gemini": {
      "enabled": true,
      "lastModified": "2026-02-28T10:30:00Z"
    },
    "kiro": {
      "enabled": false,
      "lastModified": "2026-02-28T09:15:00Z"
    }
  }
}
```

**字段说明**：
- `version`: 配置文件版本
- `lastUpdated`: 最后更新时间
- `skillsPath`: Skills 目录路径
- `tools`: 各个工具的基本配置
  - `enabled`: 工具是否开启
  - `lastModified`: 最后修改时间

### 2. 单个工具配置文件：`data/{toolId}-skills.json`

每个工具的 Skills 配置单独存储：

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
    },
    "database-helper": {
      "enabled": true,
      "enabledAt": "2026-02-28T10:25:00Z"
    }
  }
}
```

**字段说明**：
- `toolId`: 工具 ID
- `toolName`: 工具名称
- `version`: 配置文件版本
- `lastUpdated`: 最后更新时间
- `skills`: Skills 配置
  - `enabled`: 是否启用
  - `enabledAt`: 启用时间（null 表示从未启用）

## 文件操作流程

### 初始化

1. 检查 `data` 目录是否存在，不存在则创建
2. 检查 `tools-config.json` 是否存在，不存在则创建默认配置
3. 加载全局配置

### 读取工具配置

1. 读取 `data/tools-config.json` 获取工具开关状态
2. 读取 `data/{toolId}-skills.json` 获取 Skills 配置
3. 如果文件不存在，返回默认配置

### 保存工具配置

1. 更新 `data/tools-config.json` 中的工具状态
2. 更新 `data/{toolId}-skills.json` 中的 Skills 配置
3. 更新时间戳

### 切换工具开关

1. 更新 `data/tools-config.json` 中的 `enabled` 状态
2. 如果开启：根据 `{toolId}-skills.json` 拷贝已启用的 Skills
3. 如果关闭：删除工具 skills 目录下的所有 Skills

### 切换 Skill 状态

1. 更新 `data/{toolId}-skills.json` 中的 Skill 状态
2. 如果启用：拷贝 Skill 到工具 skills 目录
3. 如果禁用：从工具 skills 目录删除 Skill
4. 更新时间戳

## API 设计

### 后端 API

```typescript
// 读取全局配置
getGlobalConfig(): Promise<GlobalConfig>

// 保存全局配置
saveGlobalConfig(config: GlobalConfig): Promise<boolean>

// 读取工具 Skills 配置
getToolSkillsConfig(toolId: string): Promise<ToolSkillsConfig>

// 保存工具 Skills 配置
saveToolSkillsConfig(toolId: string, config: ToolSkillsConfig): Promise<boolean>

// 批量切换 Skills
batchToggleSkills(toolId: string, skillNames: string[], enabled: boolean): Promise<boolean>
```

### 前端调用

```typescript
// 加载配置
const globalConfig = await window.api.getGlobalConfig()
const skillsConfig = await window.api.getToolSkillsConfig('gemini')

// 保存配置
await window.api.saveGlobalConfig(globalConfig)
await window.api.saveToolSkillsConfig('gemini', skillsConfig)

// 批量操作
await window.api.batchToggleSkills('gemini', ['api-tester', 'code-reviewer'], true)
```

## 兼容性

### 向后兼容

如果检测到旧版本配置文件（`data/{toolId}.json`），自动迁移到新格式：

```typescript
// 旧格式
{
  "enabled": true,
  "skills": {
    "api-tester": true,
    "code-reviewer": false
  }
}

// 迁移到新格式
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

## 错误处理

1. 文件读取失败：返回默认配置
2. 文件写入失败：记录错误日志，提示用户
3. JSON 解析失败：尝试修复或返回默认配置
4. 目录不存在：自动创建

## 性能优化

1. 配置文件缓存：避免频繁读取磁盘
2. 批量操作：减少文件写入次数
3. 异步操作：不阻塞 UI

## 安全性

1. 路径验证：防止路径遍历攻击
2. 文件权限：确保只有程序可以访问
3. 数据验证：验证 JSON 格式和字段类型
