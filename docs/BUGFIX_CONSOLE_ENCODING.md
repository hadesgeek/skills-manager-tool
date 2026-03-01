# 控制台中文乱码问题修复

## 问题描述
在 Windows 系统上运行 Electron 应用时，控制台输出的中文显示为乱码。

## 根本原因
Electron 的控制台输出不受运行时 `chcp` 命令影响，需要在启动前设置编码。

## 解决方案

直接在 `package.json` 中设置编码，用户使用 `npm run dev` 启动：

```json
"dev": "chcp 65001 >nul && electron-vite dev"
```

## 修改的文件
1. `package.json` - 修改 `dev` 脚本添加编码设置
2. `src/main/index.ts` - 移除无效的运行时编码设置代码

## 验证
启动应用后，控制台应该正确显示中文：
```
[CheckTools] Gemini (.gemini): 已检测到
[CheckTools] Kiro (.kiro): 已检测到
[ReadSkills] electron - 使用缓存的描述
```

## 注意事项
- 编码设置必须在 Electron 进程启动前完成
- 运行时修改编码（如在 `app.whenReady()` 中）不会生效
- 如果仍有乱码，请确保终端本身支持 UTF-8 编码
