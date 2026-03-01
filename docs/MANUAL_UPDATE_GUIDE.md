# Tools.vue 手动更新指南

由于文件编码问题，请在代码编辑器（如 VS Code）中手动更新以下内容：

## 步骤 1：打开文件
打开 `skills-manager-app/src/renderer/src/views/Tools.vue`

## 步骤 2：更新 toggleTool 函数（约第282行）

**查找：**
```javascript
// 切换工具开关
const toggleTool = (tool: Tool) => {
  tool.installed = !tool.installed
  console.log(`切换工具 ${tool.name}: ${tool.installed}`)
}
```

**替换为：**
```javascript
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

## 步骤 3：更新 loadToolSkills 函数（约第296行）

**查找：**
```javascript
// 加载工具的 Skills 列表
const loadToolSkills = async (tool: Tool) => {
  // 第二阶段实现
  currentToolSkills.value = [
    { name: 'skill-creator', active: true },
    { name: 'code-reviewer', active: false },
    { name: 'api-tester', active: true },
    { name: 'database-helper', active: false }
  ]
}
```

**替换为：**
```javascript
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

## 步骤 4：更新 toggleSkill 函数（约第307行）

**查找：**
```javascript
// 切换 Skill 开关
const toggleSkill = async (skill: Skill) => {
  skill.active = !skill.active
  console.log(`切换 Skill ${skill.name}: ${skill.active}`)
  // 第二阶段实现：拷贝或删除 skill 目录
}
```

**替换为：**
```javascript
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
    }
  } catch (error) {
    console.error('切换 Skill 失败:', error)
  }
}
```

## 步骤 5：更新 loadTools 函数（约第220行）

在 `await checkToolsInstallation()` 这一行**之后**添加：

```javascript
  // 加载每个工具的配置，更新 installed 状态
  for (const tool of toolsData.value) {
    const config = await window.api.getToolConfig(tool.id)
    tool.installed = config.enabled || false
  }
```

## 步骤 6：更新 checkToolsInstallation 函数（约第238行）

**删除这一行：**
```javascript
        tool.installed = result.installed
```

只保留：
```javascript
        tool.configPath = result.configPath
        tool.skillsPath = result.skillsPath
```

## 步骤 7：保存文件

确保文件以 **UTF-8** 编码保存（在 VS Code 中，右下角可以看到编码格式）。

## 完成！

保存后，重新运行程序，所有业务逻辑就实现了。
