# Windows 编码规范（Global Rule）

## 强制规则

### 1. 控制台编码设置
**所有 Windows 应用的 package.json 启动脚本必须在命令前添加 `chcp 65001 >nul &&`**

```json
{
  "scripts": {
    "dev": "chcp 65001 >nul && electron-vite dev",
    "start": "chcp 65001 >nul && node src/index.js"
  }
}
```

这样用户可以直接使用 `npm run dev` 命令，无需额外的脚本文件。

### 2. 禁止的做法
- ❌ 不要在运行时代码中使用 `spawn('chcp')` 或 `execSync('chcp')`
- ❌ 不要依赖 `process.env.PYTHONIOENCODING` 等环境变量
- ❌ 不要在 `app.whenReady()` 或其他运行时尝试修改编码
- ❌ 不要创建 .bat 或 .cmd 启动脚本

**原因**：进程启动后控制台编码已固定，运行时修改无效。直接在 package.json 中设置最简单有效。

### 3. 文件操作
所有文件读写必须明确指定 UTF-8 编码：

```typescript
// 读取
const content = await fs.promises.readFile(path, 'utf8')

// 写入
await fs.promises.writeFile(path, content, 'utf8')
```

### 4. 源文件编码
- 所有源代码文件使用 UTF-8 without BOM 保存
- 仅在特殊需求时使用 UTF-8 with BOM

## 验证标准

启动后控制台应正确显示中文：
```
✅ [Info] 应用启动成功
❌ [Info] 搴旂敤鍚姩鎴愬姛  (乱码)
```

## 适用场景
- Electron 应用
- Node.js 应用
- 任何需要在 Windows 控制台输出中文的应用

## 检查清单
- [ ] package.json 所有启动脚本包含 `chcp 65001 >nul &&`
- [ ] 移除了所有运行时编码设置代码
- [ ] 文件操作指定 `'utf8'` 编码
- [ ] 在 Windows 上测试 `npm run dev` 中文输出正常
