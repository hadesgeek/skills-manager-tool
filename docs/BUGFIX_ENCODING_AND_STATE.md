# Bug 修复说明 - 编码问题和状态混淆

## 修复时间
2026-02-28

## 问题 1：控制台中文乱码

### 问题描述
后端日志输出中文时出现乱码：
```
[CheckTools] Gemini (.gemini): 宸插畨瑁?
[CheckTools] Antigravity (.antigravity): 宸插畨瑁?
```

### 原因分析
Windows 控制台默认使用 GBK 编码，而 Node.js 输出的是 UTF-8 编码，导致中文显示乱码。

### 解决方案
将所有后端日志输出改为英文，避免编码问题：

**修改的文件**：`src/main/ipc/skills.ts`

**修改内容**：
- `已安装` → `Detected`
- `未安装` → `Not Detected`
- `的 Skills` → `Skills`
- `启用` → `Enable`
- `禁用` → `Disable`
- `源目录` → `Source`
- `目标目录` → `Target`
- `拷贝成功` → `Copy success`
- `删除成功` → `Delete success`
- `开启工具` → `Enable tool`
- `关闭工具` → `Disable tool`
- `操作失败` → `Operation failed`
- `读取配置失败` → `Read config failed`
- `保存配置失败` → `Save config failed`
- `配置已保存` → `Config saved`
- `管理目录不存在` → `directory not found`

### 效果
控制台日志现在显示为：
```
[CheckTools] Gemini (.gemini): Detected
[CheckTools] Antigravity (.antigravity): Detected
[GetToolSkills] gemini Skills: [...]
```

## 问题 2：开关状态和安装状态混淆

### 问题描述
工具的开关状态（toggle-switch）和安装状态（是否检测到工具目录）混在一起，导致：
1. 已安装的工具显示为"未检测到"
2. 开关状态不正确
3. 逻辑混乱

### 原因分析
原来的设计中，`installed` 字段既表示"是否检测到工具目录"，又表示"用户是否开启工具"，导致状态混淆。

### 解决方案
将状态分离为两个独立字段：

#### 1. 修改 Tool 接口

**文件**：`src/renderer/src/views/Tools.vue`

```typescript
interface Tool {
  id: string
  name: string
  dirName: string
  installed: boolean  // 是否检测到工具目录（已安装）
  enabled: boolean    // 用户是否开启了工具（开关状态）
  configPath: string
  skillsPath: string
  iconPath?: string
}
```

#### 2. 修改 loadTools 函数

```typescript
const loadTools = async () => {
  toolsData.value = toolsConfigData.map(tool => ({
    id: nameToId(tool.name),
    name: tool.name,
    dirName: tool.dirName,
    installed: false,  // 是否检测到工具目录
    enabled: false,    // 用户是否开启工具
    configPath: '',
    skillsPath: '',
    iconPath: getToolIconPath(nameToId(tool.name))
  }))
  
  // 检查工具安装状态（更新 installed 和路径）
  await checkToolsInstallation()
  
  // 加载每个工具的配置，更新 enabled 状态
  for (const tool of toolsData.value) {
    const config = await window.api.getToolConfig(tool.id)
    tool.enabled = config.enabled || false
  }
}
```

#### 3. 修改 checkToolsInstallation 函数

```typescript
const checkToolsInstallation = async () => {
  try {
    const results = await window.api.checkToolsInstallation(
      toolsConfigData.map(t => ({ name: t.name, dirName: t.dirName }))
    )
    
    results.forEach(result => {
      const tool = toolsData.value.find(t => t.id === result.id)
      if (tool) {
        tool.installed = result.installed  // 更新安装状态
        tool.configPath = result.configPath
        tool.skillsPath = result.skillsPath
      }
    })
  } catch (error) {
    console.error('检查工具安装状态失败:', error)
  }
}
```

#### 4. 修改 toggleTool 函数

```typescript
const toggleTool = async (tool: Tool) => {
  const newState = !tool.enabled  // 切换 enabled 状态，不是 installed
  
  if (newState) {
    // 开启工具
    const config = await window.api.getToolConfig(tool.id)
    
    if (Object.keys(config.skills || {}).length === 0) {
      await openSkillListModal(tool)
    } else {
      const success = await window.api.toggleTool(tool.id, true)
      if (success) {
        tool.enabled = true  // 更新 enabled 状态
        console.log(`工具 ${tool.name} 已开启`)
      }
    }
  } else {
    const success = await window.api.toggleTool(tool.id, false)
    if (success) {
      tool.enabled = false  // 更新 enabled 状态
      console.log(`工具 ${tool.name} 已关闭`)
    }
  }
}
```

#### 5. 修改模板绑定

```vue
<div 
  class="toggle-switch" 
  :class="{ active: tool.enabled }"
  @click.stop="toggleTool(tool)"
>
  <div class="toggle-knob"></div>
</div>
```

### 状态说明

| 字段 | 含义 | 来源 | 用途 |
|------|------|------|------|
| `installed` | 是否检测到工具目录 | `checkToolsInstallation()` | 显示"已检测到/未检测到"标签 |
| `enabled` | 用户是否开启工具 | `getToolConfig()` | 控制开关状态 |

### 逻辑流程

1. **页面加载**：
   - 初始化所有工具，`installed = false`, `enabled = false`
   - 调用 `checkToolsInstallation()` 更新 `installed` 状态
   - 调用 `getToolConfig()` 更新 `enabled` 状态

2. **显示状态**：
   - 状态标签显示：`installed ? '已检测到' : '未检测到'`
   - 开关状态显示：`enabled ? '开启' : '关闭'`

3. **切换开关**：
   - 只修改 `enabled` 状态
   - 不影响 `installed` 状态

### 效果

现在：
- ✅ "已检测到/未检测到"标签正确显示工具是否安装
- ✅ 开关状态独立，正确反映用户是否开启工具
- ✅ 逻辑清晰，状态不混淆

## 测试验证

### 测试场景 1：已安装但未开启的工具
- 状态标签：已检测到（绿色）
- 开关状态：关闭（灰色）

### 测试场景 2：已安装且已开启的工具
- 状态标签：已检测到（绿色）
- 开关状态：开启（绿色）

### 测试场景 3：未安装的工具
- 状态标签：未检测到（灰色）
- 开关状态：关闭（灰色）
- 可以尝试开启，但会因为没有目录而失败

## 总结

两个问题都已修复：
1. ✅ 控制台日志改为英文，避免编码问题
2. ✅ 状态分离为 `installed` 和 `enabled`，逻辑清晰

所有修改已完成，可以重新测试。
