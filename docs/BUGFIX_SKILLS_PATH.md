# Bug 修复 - Skills 路径问题

## 问题描述

工具页面的 Skills 列表只显示 4 个 Skills，而不是显示用户 Skills 目录下的所有 Skills。

## 原因分析

`getToolSkills` 函数读取的是程序目录下的 `skills` 文件夹（`skills-manager-app/skills/`），而不是用户配置的 Skills 目录（`E:\AITools\SKillsManager\Skills`）。

### 目录对比

| 目录 | 用途 | Skills 数量 |
|------|------|------------|
| `skills-manager-app/skills/` | 程序示例 Skills | 4 个（示例） |
| `E:\AITools\SKillsManager\Skills` | 用户 Skills 目录 | 多个（实际使用） |

### 问题根源

原来的实现：
```typescript
async function getToolSkills(toolId: string) {
    const skillsManagerDir = getSkillsManagerDir() // 读取程序目录下的 skills
    const allSkills = await readSkills(skillsManagerDir)
    // ...
}
```

这导致：
1. 只读取程序目录下的 4 个示例 Skills
2. 无法读取用户实际的 Skills
3. 和 Skills 页面的数据不一致

## 解决方案

### 1. 修改后端 API

让 `getToolSkills` 接受 `skillsPath` 参数，从用户指定的目录读取：

**文件**：`src/main/ipc/skills.ts`

```typescript
// IPC 处理器
ipcMain.handle('tools:getToolSkills', async (_, toolId: string, skillsPath: string) => {
    return await getToolSkills(toolId, skillsPath)
})

// 函数实现
async function getToolSkills(toolId: string, skillsPath: string): Promise<Array<{name: string, active: boolean}>> {
    if (!skillsPath || !fs.existsSync(skillsPath)) {
        console.log(`[GetToolSkills] Skills path not found: ${skillsPath}`)
        return []
    }
    
    // 获取工具配置
    const config = await getToolConfig(toolId)
    
    // 使用 readSkills 函数读取所有 Skills
    const allSkills = await readSkills(skillsPath)
    
    // 转换为工具 Skills 格式，标记哪些已启用
    const toolSkills = allSkills.map(skill => ({
        name: skill.name,
        active: config.skills[skill.name] || false
    }))
    
    console.log(`[GetToolSkills] ${toolId} Skills count: ${toolSkills.length}`)
    return toolSkills
}
```

### 2. 更新 Preload API

**文件**：`src/preload/index.ts`

```typescript
getToolSkills: (toolId: string, skillsPath: string) => 
    electronAPI.ipcRenderer.invoke('tools:getToolSkills', toolId, skillsPath)
```

**文件**：`src/preload/index.d.ts`

```typescript
getToolSkills: (toolId: string, skillsPath: string) => 
    Promise<Array<{name: string, active: boolean}>>
```

### 3. 更新前端调用

**文件**：`src/renderer/src/views/Tools.vue`

```typescript
// 添加 skillsPath 配置
const skillsPath = ref('E:\\AITools\\SKillsManager\\Skills') // TODO: 从设置中读取

// 调用时传入 skillsPath
const loadToolSkills = async (tool: Tool) => {
  try {
    const skills = await window.api.getToolSkills(tool.id, skillsPath.value)
    currentToolSkills.value = skills
    console.log(`加载 ${tool.name} 的 Skills: ${skills.length} 个`)
  } catch (error) {
    console.error('加载 Skills 失败:', error)
    currentToolSkills.value = []
  }
}
```

## 效果

现在 `getToolSkills` 会：
1. ✅ 从用户配置的 Skills 目录读取
2. ✅ 显示所有有效的 Skills（和 Skills 页面一致）
3. ✅ 正确标记哪些 Skills 已被工具启用

## 后续优化

### TODO: 从设置中读取 Skills 路径

目前 `skillsPath` 是硬编码的，应该：
1. 在 Settings 页面保存 Skills 路径配置
2. 在 Tools 页面从配置中读取
3. 使用统一的配置管理

**建议实现**：

```typescript
// Settings.vue
const skillsPath = ref('')

onMounted(() => {
  const savedPath = localStorage.getItem('SKILLS_PATH')
  if (savedPath) {
    skillsPath.value = savedPath
  } else {
    skillsPath.value = 'E:\\AITools\\SKillsManager\\Skills'
    localStorage.setItem('SKILLS_PATH', skillsPath.value)
  }
})

function saveSettings() {
  localStorage.setItem('SKILLS_PATH', skillsPath.value)
  // ...
}

// Tools.vue
onMounted(() => {
  const savedPath = localStorage.getItem('SKILLS_PATH')
  if (savedPath) {
    skillsPath.value = savedPath
  }
  loadTools()
})
```

## 测试验证

### 测试步骤

1. 确保用户 Skills 目录（`E:\AITools\SKillsManager\Skills`）包含多个 Skills
2. 打开工具页面
3. 点击任意工具的设置按钮（⚙）
4. 查看 Skills 列表弹窗

### 预期结果

- 弹窗显示用户 Skills 目录下的所有 Skills
- Skills 数量和 Skills 页面一致
- 控制台输出：`[GetToolSkills] gemini Skills count: X`（X 是实际数量）

## 相关文件

- `src/main/ipc/skills.ts`：修改了 `getToolSkills` 函数
- `src/preload/index.ts`：更新了 API 调用
- `src/preload/index.d.ts`：更新了类型定义
- `src/renderer/src/views/Tools.vue`：添加了 `skillsPath` 配置

## 总结

✅ 修复完成，现在工具页面会从用户配置的 Skills 目录读取所有 Skills，和 Skills 页面保持一致。
