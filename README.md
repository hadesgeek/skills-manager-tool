# Skills Manager Tool

<div align="center">

![Skills Manager Tool](resources/icon.png)

**一个现代化的 AI 编码助手 Skills 管理工具**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-v28+-blue.svg)](https://www.electronjs.org/)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-green.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

[English](README_EN.md) | 简体中文

</div>

## 📖 简介

Skills Manager Tool 是一个专为 AI 编码助手（如 Kiro、Qoder、Cursor、Cline 等）设计的 Skills 管理工具。它提供了直观的图形界面，帮助开发者轻松管理、编辑和分发 AI 编码助手的技能配置。

## 🎯 解决的核心痛点

### 1. 📚 Skills 全是英文，查看翻译很麻烦
- **问题**：大多数 AI 编码助手的 Skills 文档都是英文的，对于中文开发者来说阅读和理解比较困难
- **解决方案**：集成 Gemini AI 自动翻译功能，支持中英文双语同时查看，翻译结果自动缓存，无需重复翻译

### 2. � 在不同工具间使用 Skills 需要手工拷贝
- **问题**：当你想在 Kiro、Cursor、Cline 等多个工具中使用同一个 Skill 时，需要手动复制文件到各个工具的配置目录
- **解决方案**：统一管理所有 Skills，一键启用/禁用，自动同步到各个工具，告别手工拷贝的麻烦

### 3. 🎨 缺少可视化管理界面
- **问题**：传统的 Skills 管理需要在文件系统中手动操作，效率低下
- **解决方案**：提供现代化的图形界面，支持搜索、筛选、批量操作，让管理变得简单高效

## 📸 应用截图

### 首页 - Skills 管理
![首页](docs/首页.png)

在首页可以浏览所有可用的 Skills，每个 Skill 都有：
- AI 生成的精美图标
- 中英文双语描述
- 使用状态指示（绿点表示正在使用）
- 快速搜索和筛选功能

### Skill 详情页
![Skill 详情页](docs/首页-skill说明页png.png)

点击 Skill 卡片可以查看详细信息：
- 完整的中英文描述对照
- 内置 Markdown 编辑器，支持实时预览
- 一键编辑和保存

### 工具管理页
![工具页](docs/工具页.png)

管理所有支持的 AI 编码工具：
- 自动检测已安装的工具
- 一键启用/禁用工具同步
- 查看每个工具的配置路径

### 工具详情页 - Skills 选择
![工具详情页](docs/工具详情页.png)

为每个工具单独配置 Skills：
- 批量选择要启用的 Skills
- 实时同步到工具配置目录
- 支持自定义工具路径

## ✨ 核心特性

- 🎯 **统一管理**：集中管理所有 AI 工具的 Skills 配置
- 🔄 **智能同步**：一键启用/禁用 Skills，自动同步到各个工具
- 🌐 **AI 翻译**：集成 Gemini API，自动翻译 Skills 描述为中文
- 🎨 **图标生成**：使用 AI 自动为每个 Skill 生成精美图标
- 📝 **可视化编辑**：内置 Markdown 编辑器，支持实时预览
- 🔍 **快速搜索**：快速查找和筛选 Skills
- 💾 **状态持久化**：自动保存配置和状态
- 🎭 **多工具支持**：支持 Kiro、Qoder、Cursor、Cline 等主流 AI 编码工具
- 📊 **完善的日志系统**：开发和生产环境都有详细的日志记录，便于问题诊断
- 🔧 **开发者工具**：开发环境支持 DevTools，方便调试和开发

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- Windows 10/11（当前版本）

### 安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/skills-manager.git

# 进入项目目录
cd skills-manager-app

# 安装依赖
npm install

# 启动开发模式
npm run dev
```

### 构建

```bash
# 构建应用
npm run build

# 打包为可执行文件
npm run build:win
```

## 📚 使用指南

### 1. 首次配置

启动应用后，需要进行以下配置：

1. **设置 Skills 目录**：指定存放所有 Skills 的根目录
2. **配置 Gemini API Key**（可选）：用于 AI 翻译和图标生成
3. **检测已安装工具**：自动扫描系统中已安装的 AI 编码工具

> 💡 提示：如果遇到问题，可以在开发环境中按 F12 打开开发者工具查看详细日志

### 2. 管理 Skills

#### Skills 页面

- **查看 Skills**：浏览所有可用的 Skills，查看中英文描述和图标
- **搜索 Skills**：使用搜索框快速查找特定 Skills
- **编辑 Skills**：点击卡片进入编辑器，修改 Skill 内容
- **状态指示**：绿点表示 Skill 正在被某个工具使用，灰点表示未使用
- **刷新图标**：长按图标可重新生成

#### 工具页面

- **查看工具**：显示所有支持的 AI 编码工具及其安装状态
- **启用/禁用工具**：通过开关控制工具的 Skills 同步
- **管理 Skills**：点击设置按钮，选择要为该工具启用的 Skills
- **批量操作**：支持多选模式，批量启用/禁用 Skills
- **自定义路径**：点击文件夹图标，自定义工具的配置和 Skills 路径

### 3. AI 功能

#### 自动翻译

应用会自动检测英文描述并翻译为中文：

- 首次加载时自动翻译未缓存的 Skills
- 删除 `.desc_cn.md` 缓存文件后会重新翻译
- 翻译结果会缓存到 Skill 目录下

#### 图标生成

使用 Gemini Nano Banana 模型生成图标：

- 基于 Skill 名称和描述生成 50x50 像素图标
- 图标保存为 PNG 格式，存储在 `data/tools-imgs/` 目录
- 支持长按图标重新生成

## 🛠️ 技术栈

### 前端
- Vue 3 + TypeScript
- Vite + electron-vite
- Vditor（Markdown 编辑器）
- Vue Router

### 后端
- Electron + Node.js
- Electron IPC
- Gemini API

### 数据存储
- JSON 文件存储
- 文件系统缓存
- 日志文件（`%APPDATA%\skills-manager-app\logs\`）

## 📁 项目结构

```
skills-manager-app/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── index.ts       # 主进程入口
│   │   ├── ipc/           # IPC 通信处理
│   │   │   ├── skills.ts  # Skills 管理逻辑
│   │   │   └── storage.ts # 存储管理逻辑
│   │   └── storage/       # 数据持久化
│   ├── preload/           # 预加载脚本
│   │   ├── index.ts       # API 暴露
│   │   └── index.d.ts     # 类型定义
│   └── renderer/          # 渲染进程（前端）
│       ├── src/
│       │   ├── views/     # 页面组件
│       │   ├── components/# 通用组件
│       │   ├── config/    # 配置文件
│       │   └── assets/    # 静态资源
│       └── index.html     # 入口 HTML
├── data/                  # 数据目录（运行时生成）
│   ├── tools-imgs/        # 生成的图标
│   ├── skill-icons.json   # 图标映射
│   └── *.json             # 工具配置
├── skills/                # 示例 Skills
├── docs/                  # 文档
└── test/                  # 测试脚本
```

## 🔐 安全说明

- API Key 存储在本地，不会上传到云端
- 所有数据存储在本地，不会发送到第三方服务器
- AI 翻译和图标生成仅调用 Gemini API
- 不收集任何用户数据或使用统计

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 开发日志

详细的开发过程和技术决策记录在 `plan/` 目录：

- [日志系统实现](plan/logging-implementation-summary.md)
- [Skills 目录修复](plan/skills-directory-fix-summary.md)
- [DevTools 启用](plan/devtools-enable-summary.md)
- [Vditor 渲染问题解决](plan/vditor-issue-resolution-summary.md)
- [生产环境优化](plan/production-devtools-removal.md)
- [完整工作总结](plan/final-work-summary.md)

测试和调试指南在 `test/` 目录：

- [Vditor 调试指南](test/vditor-debug-guide.md)
- [打包测试指南](test/vditor-packaging-test.md)
- [DevTools 快速参考](test/devtools-quick-reference.md)

## 🐛 已知问题

- 当前仅支持 Windows 系统
- 图标生成依赖 Gemini API，需要稳定的网络连接
- 大量 Skills 时首次加载可能较慢

## 🔧 故障排查

如果遇到问题，可以尝试以下方法：

1. **开发环境调试**：
   - 运行 `npm run dev`
   - 按 F12 或 Ctrl+Shift+I 打开开发者工具
   - 查看控制台日志和网络请求

2. **查看日志文件**：
   - 日志位置：`%APPDATA%\skills-manager-app\logs\app.log`
   - 包含详细的错误信息和堆栈跟踪

3. **常见问题**：
   - Skills 页面为空：检查设置中的 Skills 目录是否正确配置
   - Markdown 无法渲染：查看日志文件中的错误信息
   - 工具同步失败：确认工具路径配置正确

## 🗺️ 路线图

- [ ] 支持 macOS 和 Linux
- [ ] 添加 Skills 市场功能
- [ ] 支持自定义工具配置
- [ ] 添加 Skills 模板
- [ ] 支持批量导入/导出
- [ ] 添加更多 AI 模型支持

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Vditor](https://github.com/Vanessa219/vditor) - Markdown 编辑器
- [Gemini API](https://ai.google.dev/) - AI 翻译和图标生成

## 📧 联系方式

如有问题或建议，欢迎通过以下方式联系：

- 提交 [Issue](https://github.com/hadesgeek/skills-manager-tool/issues)
- 发送邮件至：hadesgeek@gmail.com

---

<div align="center">

**如果这个项目对你有帮助，请给个 ⭐️ Star 支持一下！**

Made with ❤️

</div>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=hadesgeek/skills-manager-tool&type=Date)](https://star-history.com/#hadesgeek/skills-manager-tool&Date)

![Views](https://komarev.com/ghpvc/?username=hadesgeek&repo=skills-manager-tool&label=Repository%20views&color=blue&style=flat)

[![Clement Parker profile views](https://u8views.com/api/v1/github/profiles/129089956/views/day-week-month-total-count.svg)](https://u8views.com/github/hadesgeek)