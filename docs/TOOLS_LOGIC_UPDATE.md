# Tools.vue 业务逻辑更新说明

## 需要修改的函数

### 1. toggleTool 函数 - 切换工具开关

```typescript
// 切换工具开关
const toggleTool = async (tool: Tool) => {
  const newState = !tool.installed
  
  if (newState) {
    // 开启工具
    const config = await window.api.getToolConfig(tool.id)
    
    // 如果是第一次开启（没有配置的 skills）
    if (Object.keys(config.skills || {}).length === 0) {
      // 打开 Skills 列表弹窗让用户选择
      await openSkillListModal(tool)
    } else {
      // 不是第一次，直接根据配置拷贝已启用的 skills
      const success = await window.api.toggleTool(tool.id, true)
      if (success) {
        tool.installed = true
        console.log(`工具 ${tool.name} 已开启`)
      }
    }
  } else {
    // 关闭工具：删除所有 skills
    const success = await window.api.toggleTool(tool.id, false)
    if (success) {
      tool.installed = false
      console.log(`工具 ${tool.name} 已关闭`)
    }
  }
}
```

### 2. loadToolSkills 函数 - 加载工具的 Skills 列表

```typescript
// 加载工具的 Skills 列表
const loadToolSkills = async (tool: Tool) => {
  try {
    const skills = await window.api.getToolSkills(tool.id)
    currentToolSkills.value = skills
    console.log(`加载 ${tool.name} 的 Skills:`, skills)
  } catch (error) {
    console.error('加载 Skills 失败:', error)
    currentToolSkills.value = []
  }
}
```

### 3. toggleSkill 函数 - 切换 Skill 开关

```typescript
// 切换 Skill 开关
const toggleSkill = async (skill: Skill) => {
  const newState = !skill.active
  
  if (!currentTool.value) return
  
  try {
    const success = await window.api.toggleSkill(
      currentTool.value.id,
      skill.name,
      newState
    )
    
    if (success) {
      skill.active = newState
      console.log(`Skill ${skill.name} ${newState ? '已启用' : '已禁用'}`)
      
      // 如果当前工具是开启状态，更新工具状态
      if (currentTool.value.installed) {
        // 检查是否还有启用的 skills
        const hasActiveSkills = currentToolSkills.value.some(s => s.active)
        if (!hasActiveSkills) {
          // 如果没有启用的 skills，关闭工具
          currentTool.value.installed = false
          await window.api.toggleTool(currentTool.value.id, false)
        }
      } else if (newState) {
        // 如果工具是关闭状态但启用了 skill，开启工具
        currentTool.value.installed = true
        await window.api.toggleTool(currentTool.value.id, true)
      }
    }
  } catch (error) {
    console.error('切换 Skill 失败:', error)
  }
}
```

### 4. loadTools 函数更新

```typescript
const loadTools = async () => {
  toolsData.value = toolsConfig.map(tool => {
    const id = nameToId(tool.name)
    return {
      id,
      name: tool.name,
      dirName: tool.dirName,
      installed: false, // 初始为关闭状态
      configPath: '',
      skillsPath: '',
      iconPath: getToolIconPath(id),
      tags: []
    }
  })
  
  // 调用 IPC 检测工具安装状态
  await checkToolsInstallation()
  
  // 加载每个工具的配置，更新 installed 状态
  for (const tool of toolsData.value) {
    const config = await window.api.getToolConfig(tool.id)
    tool.installed = config.enabled || false
  }
}
```

### 5. checkToolsInstallation 函数更新

```typescript
// 检测工具安装状态
const checkToolsInstallation = async () => {
  try {
    // 调用主进程 API 检测工具安装状态
    const results = await window.api.checkToolsInstallation(
      toolsConfig.map(tool => ({
        name: tool.name,
        dirName: tool.dirName
      }))
    )
    
    // 更新工具数据（只更新路径，不更新 installed 状态）
    results.forEach(result => {
      const tool = toolsData.value.find(t => t.id === result.id)
      if (tool) {
        tool.configPath = result.configPath
        tool.skillsPath = result.skillsPath
      }
    })
    
    console.log('工具检测完成:', results)
  } catch (error) {
    console.error('检测工具安装状态失败:', error)
  }
}
```

## 主要改动说明

1. **默认状态**：所有工具开关默认为关闭状态
2. **第一次开启**：检测配置，如果没有 skills 配置，弹出 Skills 列表让用户选择
3. **非第一次开启**：根据保存的配置直接拷贝已启用的 skills
4. **关闭工具**：删除工具 skills 目录下的所有 skills
5. **Skills 管理**：在弹窗中可以启用/禁用 skills，实时拷贝/删除对应目录
6. **配置持久化**：所有配置保存在程序所在目录的 data 文件夹下
