# 存储模块缓存优化

## 问题描述

在工具页面加载时，发现频繁读取 `tools-state.json` 文件，导致性能问题：

```
[IPC] 获取工具配置: qoder
[Storage] 读取文件成功: C:\Users\mszl5\AppData\Roaming\skills-manager-app\data\tools-state.json
[IPC] 获取工具配置: qoder
[Storage] 读取文件成功: C:\Users\mszl5\AppData\Roaming\skills-manager-app\data\tools-state.json
... (重复多次)
```

每次调用 `getStorageToolConfig(toolId)` 都会重新读取整个 JSON 文件，效率低下。

## 优化方案

### 1. 存储模块添加内存缓存

**文件：** `skills-manager-app/src/main/storage/index.ts`

#### 添加缓存变量
```typescript
// 内存缓存
let appSettingsCache: any = null
let toolsStateCache: any = null
let cacheTimestamp = {
  appSettings: 0,
  toolsState: 0
}
```

#### 优化读取函数
- 检查文件修改时间，如果缓存有效则直接返回缓存
- 只在文件被修改后才重新读取
- 减少磁盘 I/O 操作

```typescript
function readJsonFile<T>(filePath: string, defaultValue: T, useCache: boolean = true): T {
  // 检查缓存是否有效
  if (useCache) {
    const stats = fs.statSync(filePath)
    const fileModTime = stats.mtimeMs
    
    if (filePath === TOOLS_STATE_FILE && toolsStateCache && cacheTimestamp.toolsState >= fileModTime) {
      console.log(`[Storage] 使用缓存: ${filePath}`)
      return toolsStateCache
    }
  }
  
  // 读取文件并更新缓存
  const data = JSON.parse(content)
  if (useCache && filePath === TOOLS_STATE_FILE) {
    toolsStateCache = data
    cacheTimestamp.toolsState = stats.mtimeMs
  }
  
  return data
}
```

#### 写入时清除缓存
```typescript
function writeJsonFile(filePath: string, data: any): boolean {
  // 写入文件
  fs.writeFileSync(filePath, content, 'utf8')
  
  // 清除对应的缓存，强制下次重新读取
  if (filePath === TOOLS_STATE_FILE) {
    toolsStateCache = null
    cacheTimestamp.toolsState = 0
  }
  
  return true
}
```

#### 添加清除缓存函数
```typescript
export function clearCache(): void {
  console.log('[Storage] 清除所有缓存')
  appSettingsCache = null
  toolsStateCache = null
  cacheTimestamp.appSettings = 0
  cacheTimestamp.toolsState = 0
}
```

### 2. 前端优化调用方式

**文件：** `skills-manager-app/src/renderer/src/views/Tools.vue`

#### 优化前
```typescript
// 每次都调用 getStorageToolConfig，导致重复读取文件
const toolConfig = await window.api.getStorageToolConfig(tool.id)
```

#### 优化后
```typescript
// 一次性获取所有工具状态，利用后端缓存
const toolsState = await window.api.getToolsState()
const toolConfig = toolsState.tools[tool.id]
```

#### 修改位置

1. **loadToolSkills 函数**
   - 从 `getStorageToolConfig(tool.id)` 改为 `getToolsState()`
   - 从返回的完整状态中提取单个工具配置

2. **toggleTool 函数**
   - 同样改为使用 `getToolsState()`
   - 避免重复读取文件

## 优化效果

### 优化前
- 每次获取工具配置都读取文件
- 20 个工具 = 20 次文件读取
- 日志充满重复的文件读取信息

### 优化后
- 第一次读取后缓存在内存
- 后续调用直接使用缓存
- 只在文件被修改时才重新读取
- 大幅减少磁盘 I/O 操作

### 性能提升
- 文件读取次数：20+ 次 → 1 次
- 响应速度：显著提升
- 日志清晰度：大幅改善

## 缓存失效机制

1. **文件修改检测**
   - 使用 `fs.statSync()` 获取文件修改时间
   - 比较缓存时间戳和文件修改时间
   - 文件被修改后自动重新读取

2. **写入时清除**
   - 任何写入操作都会清除对应缓存
   - 确保下次读取获取最新数据

3. **手动清除**
   - 提供 `clearCache()` 函数
   - 可用于调试或强制刷新

## 注意事项

1. **缓存一致性**
   - 缓存基于文件修改时间
   - 外部修改文件会自动检测到

2. **内存占用**
   - 缓存的是 JSON 对象
   - 配置文件通常很小，内存占用可忽略

3. **多进程场景**
   - Electron 主进程单例
   - 不存在多进程竞争问题

## 测试建议

1. 打开工具页面，观察日志
2. 应该只看到一次 "读取文件成功"
3. 后续操作应该显示 "使用缓存"
4. 修改配置后保存，应该清除缓存并重新读取

## 相关文件

- `skills-manager-app/src/main/storage/index.ts` - 存储模块（添加缓存）
- `skills-manager-app/src/renderer/src/views/Tools.vue` - 工具页面（优化调用）
