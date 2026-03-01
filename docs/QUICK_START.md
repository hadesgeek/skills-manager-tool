# 快速启动指南

## 1. 安装依赖

```bash
cd skills-manager-app
npm install
```

## 2. 启动开发服务器

```bash
npm run dev
```

## 3. 验证功能

打开程序后：

1. 点击左侧导航栏的"工具"菜单
2. 查看工具列表是否正确显示
3. 尝试切换一个工具的开关
4. 如果是首次开启，会弹出 Skills 列表
5. 选择几个 Skills 并启用
6. 点击设置按钮（⚙）管理 Skills

## 4. 检查文件

### 4.1 Skills 模板目录
```
skills-manager-app/skills/
├── api-tester/
├── skill-creator/
├── code-reviewer/
└── database-helper/
```

### 4.2 配置文件目录（自动创建）
```
skills-manager-app/data/
├── gemini.json
├── kiro.json
└── ...
```

### 4.3 工具 Skills 目录（示例）
```
~/.kiro/skills/
├── api-tester/
├── skill-creator/
└── ...
```

## 5. 常见问题

### Q: Skills 列表为空？
A: 确保 `skills-manager-app/skills/` 目录存在且包含 Skills

### Q: 工具显示"未检测到"？
A: 这是正常的，表示用户目录下没有该工具的配置目录

### Q: 开关无法切换？
A: 检查控制台日志，可能是权限问题或路径错误

### Q: Skills 没有被拷贝？
A: 检查：
1. Skills 模板目录是否存在
2. 工具配置目录是否有写入权限
3. 控制台是否有错误日志

## 6. 调试技巧

### 6.1 查看控制台日志
按 F12 打开开发者工具，查看 Console 标签

### 6.2 查看配置文件
```bash
# Windows
type data\kiro.json

# 查看工具 Skills 目录
dir %USERPROFILE%\.kiro\skills
```

### 6.3 清除配置重新测试
```bash
# 删除配置文件
Remove-Item data\*.json

# 删除工具 Skills 目录
Remove-Item -Recurse -Force ~\.kiro\skills
```

## 7. 打包发布

```bash
# 构建生产版本
npm run build

# 打包为可执行文件
npm run build:win
```

打包后的程序会在 `dist` 目录下。

## 8. 生产环境部署

1. 将打包后的程序复制到目标位置
2. 在程序目录下创建 `skills` 目录
3. 将 Skills 模板复制到 `skills` 目录
4. 运行程序

## 9. 下一步

- 阅读 `TESTING_GUIDE.md` 进行完整测试
- 阅读 `SKILLS_DIRECTORY_SETUP.md` 了解目录结构
- 阅读 `IMPLEMENTATION_SUMMARY.md` 了解实现细节

## 10. 获取帮助

如有问题，请检查：
1. 控制台日志
2. 文件权限
3. 路径配置
4. Skills 目录结构

祝使用愉快！🎉
