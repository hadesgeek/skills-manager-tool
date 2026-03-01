# Bug 修复 - getToolSkills 只返回 4 个 Skills

## 问题描述

在工具页面点击设置按钮打开 Skills 列表弹窗时，只显示 4 个 Skills（api-tester, code-reviewer, database-helper, skill-creator），而不是显示所有 Skills（应该和 Skills 页面一样多）。

## 原因分析

原来的 `getToolSkills` 函数实现有问题：

```typescript
// 错误的实现
async function getToolSkills(toolId: string): Promise<Array<{name: string, active: boolean}>> {
    const skillsManagerDir = getSkillsManagerDir()
    
    // 只读取目录名，没有读取 SKILL.MD 文件
    const items = await fs.promises.readdir(skillsManagerDir, { withFileTypes: true })
    const skills: Array<{name: string, active: boolean}> = []
    
    for (const item of items) {
        if (item.isDirectory()) {
            skills.push({
                name: item.name,
                active: config.skills[item.name] || false
            })
        }
    }
    
    return skills
}
```

这个实现只是简单地读取目录名，没有：
1. 检查目录是否包含 SKILL.MD 文件
2. 读取 Skill 的描述信息
3. 使用和 Skills 页面相同的逻辑

## 解决方案

修改 `getToolSkills` 函数，使用已有的 `readSkills` 函数来读取所有 Skills：

```typescript
// 正确的实现
async function getToolSkills(toolId: string): Promise<Array<{name: string, active: boolean}>> {
    const skillsManagerDir = getSkillsManagerDir()
    
    if (!skillsManagerDir) {
        console.log(`[GetToolSkills] Skills Manager Tool directory not found`)
        return []
    }
    
    // 获取工具配置
    const config = await getToolConfig(toolId)
    
    // 使用 readSkills 函数读取所有 Skills（不需要 API Key，因为不翻译）
    const allSkills = await readSkills(skillsManagerDir)
    
    // 转换为工具 Skills 格式，标记哪些已启用
    const toolSkills = allSkills.map(skill => ({
        name: skill.name,
        active: config.skills[skill.name] || false
    }))
    
    console.log(`[GetToolSkills] ${toolId} Skills:`, toolSkills)
    return toolSkills
}
```

## 优势

1. **复用代码**：使用已有的 `readSkills` 函数，避免重复逻辑
2. **一致性**：和 Skills 页面使用相同的逻辑读取 Skills
3. **完整性**：会检查 SKILL.MD 文件是否存在，只返回有效的 Skills
4. **可扩展**：如果以后 `readSkills` 增加新功能，`getToolSkills` 自动受益

## 测试验证

### 测试步骤

1. 确保 Skills 管理目录（`skills-manager-app/skills/`）包含多个 Skills
2. 打开工具页面
3. 点击任意工具的设置按钮（⚙）
4. 查看 Skills 列表弹窗

### 预期结果

- 弹窗应该显示所有有效的 Skills（包含 SKILL.MD 文件的目录）
- Skills 数量应该和 Skills 页面显示的数量一致
- 每个 Skill 应该正确显示启用/未启用状态

### 实际效果

现在 `getToolSkills` 会：
1. 读取 Skills 管理目录下的所有子目录
2. 检查每个目录是否包含 SKILL.MD 文件
3. 只返回有效的 Skills
4. 标记哪些 Skills 已被该工具启用

## 相关文件

- `src/main/ipc/skills.ts`：修改了 `getToolSkills` 函数
- `src/renderer/src/views/SkillsManager.vue`：Skills 页面的实现（参考）

## 总结

✅ 修复完成，现在工具页面的 Skills 列表会显示所有有效的 Skills，和 Skills 页面保持一致。
