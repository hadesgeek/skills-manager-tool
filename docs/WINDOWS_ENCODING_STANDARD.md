# Windows 系统编码标准规范

## 适用范围
所有在 Windows 系统上运行的 Node.js、Electron 等应用程序开发。

## 核心原则
**所有涉及中文输出的应用程序必须在启动前设置控制台编码为 UTF-8 (65001)**

## 强制要求

### 1. Electron 应用
对于 Electron 应用，必须在 `package.json` 的启动脚本中添加编码设置：

```json
{
  "scripts": {
    "dev": "chcp 65001 >nul && electron-vite dev",
    "start": "chcp 65001 >nul && electron-vite preview"
  }
}
```

用户可以直接使用 `npm run dev` 命令启动，无需额外脚本。

**禁止做法**：
- ❌ 不要在运行时代码中设置编码（如 `app.whenReady()` 中使用 `spawn('chcp')`）
- ❌ 不要依赖环境变量（如 `process.env.PYTHONIOENCODING`）
- ❌ 不要在应用启动后尝试修改控制台编码
- ❌ 不要创建 .bat 或 .cmd 启动脚本

**原因**：Electron 进程启动后，控制台编码已固定，运行时修改无效。直接在 package.json 中设置最简单有效。

### 2. Node.js 应用
对于普通 Node.js 应用，同样在 `package.json` 中设置：

```json
{
  "scripts": {
    "dev": "chcp 65001 >nul && nodemon src/index.js",
    "start": "chcp 65001 >nul && node src/index.js"
  }
}
```

### 3. 文件编码
所有源代码文件必须使用 UTF-8 编码保存：
- 使用 UTF-8 without BOM（推荐）
- 如果需要 BOM，仅在特定场景使用（如某些 Windows 工具要求）

### 4. 文件读写
在代码中进行文件读写时，明确指定编码：

```typescript
// 读取文件
const content = await fs.promises.readFile(filePath, 'utf8')

// 写入文件
await fs.promises.writeFile(filePath, content, 'utf8')

// 如果需要 BOM（特殊情况）
await fs.promises.writeFile(filePath, '\ufeff' + content, { encoding: 'utf8' })
```

## 验证方法

### 启动后检查
启动应用后，控制台应正确显示中文：
```
✅ [CheckTools] Gemini (.gemini): 已检测到
✅ [ReadSkills] electron - 使用缓存的描述
```

而不是乱码：
```
❌ [CheckTools] Gemini (.gemini): 宸叉娴嬪埌
❌ [ReadSkills] electron - 浣跨敤缂撳瓨鐨勬弿杩?
```

### 编码检查命令
在 PowerShell 中检查当前编码：
```powershell
chcp
```

应该显示：`Active code page: 65001`

## 常见问题

### Q: 为什么不在代码中设置编码？
A: 因为 Electron/Node.js 进程启动时就已经确定了控制台编码，启动后无法修改。必须在进程启动前设置。

### Q: 为什么使用 `>nul`？
A: `>nul` 用于隐藏 `chcp` 命令的输出信息，保持控制台输出整洁。

### Q: 如果用户手动运行 `electron-vite dev` 会怎样？
A: 会出现中文乱码。应该引导用户使用 `npm run dev` 命令。

### Q: 为什么不使用 .bat 脚本？
A: 直接在 package.json 中设置更简单，用户只需记住 `npm run dev` 即可，无需额外的脚本文件。

### Q: 其他操作系统需要这样设置吗？
A: 不需要。macOS 和 Linux 默认使用 UTF-8 编码，无需额外设置。

## 项目模板

### package.json 模板
```json
{
  "name": "your-app",
  "scripts": {
    "dev": "chcp 65001 >nul && electron-vite dev",
    "start": "chcp 65001 >nul && electron-vite preview",
    "build": "electron-vite build"
  }
}
```

### .editorconfig 模板
```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
```

## 检查清单

在提交代码前，确保：
- [ ] `package.json` 的所有启动脚本都包含 `chcp 65001 >nul &&`
- [ ] 所有源文件使用 UTF-8 编码保存
- [ ] 文件读写操作明确指定 `'utf8'` 编码
- [ ] 在 Windows 系统上使用 `npm run dev` 测试过中文输出正常
- [ ] 文档中说明了使用 `npm run dev` 启动

## 参考资料
- Windows Code Pages: https://docs.microsoft.com/en-us/windows/win32/intl/code-page-identifiers
- Node.js Buffer Encoding: https://nodejs.org/api/buffer.html#buffers-and-character-encodings
- Electron Process: https://www.electronjs.org/docs/latest/api/process
