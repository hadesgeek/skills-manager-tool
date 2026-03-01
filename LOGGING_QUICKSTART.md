# 日志系统快速启动指南

## 🎯 目标

解决编译后的 Electron 应用无法查看日志的问题，让你能够：
- ✅ 在生产环境查看应用运行日志
- ✅ 排查用户报告的问题
- ✅ 监控应用运行状态

## 🚀 快速测试（5 分钟）

### 1. 启动开发环境

```bash
cd skills-manager-app
npm run dev
```

### 2. 查看日志

**方式 1：应用内查看器**
1. 打开应用
2. 点击左侧"设置"
3. 滚动到"应用日志"部分
4. 查看实时日志

**方式 2：打开日志文件**
1. 按 `Win + R`
2. 输入：`%APPDATA%\skills-manager-app\logs`
3. 打开 `app.log`

### 3. 测试功能

在应用中执行以下操作，观察日志：
- ✅ 切换页面
- ✅ 加载 skills
- ✅ 修改设置
- ✅ 触发错误

### 4. 测试编译后的应用

```bash
npm run build:win
```

运行编译后的 exe，验证：
- ✅ 没有控制台窗口
- ✅ 日志正常写入文件
- ✅ 应用内查看器正常工作

## 📁 日志文件位置

```
Windows: %APPDATA%\skills-manager-app\logs\app.log
macOS:   ~/Library/Application Support/skills-manager-app/logs/app.log
Linux:   ~/.config/skills-manager-app/logs/app.log
```

## 🔧 主要改动

### 新增文件
- `src/main/logger.ts` - 日志管理模块
- `src/renderer/src/components/LogViewer.vue` - 日志查看器
- `docs/LOGGING_SYSTEM.md` - 详细文档

### 修改文件
- `src/main/index.ts` - 集成日志系统
- `src/main/ipc/skills.ts` - 替换 console 为 logger
- `src/preload/index.ts` - 添加日志 API
- `src/renderer/src/views/Settings.vue` - 添加日志查看器

## 💡 使用示例

### 在代码中记录日志

```typescript
import { logger } from './logger'

// 基本用法
logger.info('操作成功')
logger.error('操作失败', error)

// 带标签
logger.info('[ModuleName] 操作描述')

// 记录对象
logger.debug('数据:', { key: 'value' })
```

### 在前端查看日志

```typescript
// 获取日志内容
const logs = await window.api.readLogs()

// 清空日志
await window.api.clearLogs()

// 获取日志路径
const path = await window.api.getLogPath()
```

## 📊 日志级别

- `DEBUG` - 详细调试信息
- `INFO` - 一般操作信息（默认）
- `WARN` - 警告信息
- `ERROR` - 错误信息

## 🎨 日志查看器功能

在设置页面的"应用日志"部分：
- 🔄 刷新 - 重新加载日志
- 🗑️ 清空 - 删除所有日志
- 📂 打开目录 - 在文件管理器中打开

## ⚙️ 配置

### 日志文件大小限制
```typescript
// src/main/logger.ts
private maxLogSize = 10 * 1024 * 1024 // 10MB
```

### 保留日志文件数量
```typescript
// src/main/logger.ts
private maxLogFiles = 5 // 保留 5 个文件
```

## 🐛 故障排查

### 问题：看不到日志文件

**检查：**
```bash
dir %APPDATA%\skills-manager-app\logs
```

**解决：**
- 确保应用已运行过
- 检查文件权限

### 问题：日志中文乱码

**解决：**
- 使用 UTF-8 编码打开文件
- 推荐使用 VS Code 或 Notepad++

### 问题：应用内查看器无法显示

**调试：**
1. 打开 DevTools (F12)
2. 查看控制台错误
3. 测试 API：
```javascript
await window.api.getLogPath()
await window.api.readLogs()
```

## 📚 详细文档

- [日志系统使用说明](docs/LOGGING_SYSTEM.md)
- [测试指南](docs/LOGGING_TEST_GUIDE.md)
- [更新日志](docs/CHANGELOG_LOGGING.md)

## ✅ 验收标准

- [ ] 开发环境日志正常输出
- [ ] 生产环境日志写入文件
- [ ] 应用内查看器正常工作
- [ ] 日志文件自动轮转
- [ ] 中文显示无乱码
- [ ] 异常被正确捕获

## 🎉 完成！

现在你的应用已经具备完整的日志系统，可以：
1. 在生产环境查看运行日志
2. 排查用户报告的问题
3. 监控应用健康状态

有问题？查看详细文档或提交 Issue。
