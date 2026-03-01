# Skills 目录设置说明

## 目录结构

程序运行时需要在程序所在目录下创建 `skills` 目录，用于存放 Skills 模板。

```
程序目录/
├── skills/                    # Skills 模板目录
│   ├── skill-creator/         # 示例 Skill 1
│   │   ├── SKILL.MD          # Skill 说明文件
│   │   └── ...               # 其他 Skill 文件
│   ├── code-reviewer/        # 示例 Skill 2
│   │   ├── SKILL.MD
│   │   └── ...
│   └── ...
├── data/                      # 工具配置数据目录（自动创建）
│   ├── gemini.json           # Gemini 工具配置
│   ├── kiro.json             # Kiro 工具配置
│   └── ...
└── Skills-Manager.exe         # 程序主文件
```

## 开发环境设置

在开发环境中，`skills` 目录应该放在 `skills-manager-app` 目录下：

```
skills-manager-app/
├── skills/                    # 开发环境 Skills 目录
│   ├── skill-creator/
│   ├── code-reviewer/
│   └── ...
├── src/
├── package.json
└── ...
```

## 生产环境设置

打包后的程序会在程序所在目录查找 `skills` 目录。用户需要手动创建此目录并放入 Skills 模板。

## Skills 配置文件格式

每个 Skill 目录下应该包含一个 `SKILL.MD` 文件（大小写均可），格式如下：

```markdown
---
description: Skill 的简短描述
---

# Skill 名称

详细的 Skill 说明...
```

## 工具配置文件格式

工具配置文件保存在 `data/{toolId}.json`，格式如下：

```json
{
  "enabled": true,
  "skills": {
    "skill-creator": true,
    "code-reviewer": false,
    "api-tester": true
  }
}
```

- `enabled`: 工具是否开启
- `skills`: 各个 Skill 的启用状态

## 业务逻辑说明

1. **首次开启工具**：如果工具配置中没有 skills 配置，会弹出 Skills 列表让用户选择
2. **非首次开启**：根据保存的配置自动拷贝已启用的 skills 到工具目录
3. **关闭工具**：删除工具 skills 目录下的所有 skills
4. **Skills 管理**：在弹窗中实时启用/禁用，立即拷贝/删除文件

## 注意事项

- Skills 模板目录（`程序目录/skills/`）中的文件不会被修改，只会被拷贝
- 工具的 Skills 目录（如 `~/.kiro/skills/`）中的文件会根据用户操作被拷贝或删除
- 配置文件会自动保存在 `data` 目录下，无需手动创建
