# Electron 调试指南

## 方法 1：VS Code 调试器（推荐）

### 调试主进程（skills.ts）

1. **在代码中设置断点**
   - 打开 `src/main/ipc/skills.ts`
   - 在想要调试的行号左侧点击，设置红色断点
   - 例如：在 `readSkills` 函数的第一行设置断点

2. **启动调试**
   - 按 `F5` 或点击左侧调试图标
   - 选择 "Debug Main Process" 或 "Debug All"
   - 应用会启动，并在断点处暂停

3. **调试操作**
   - `F10` - 单步跳过（Step Over）
   - `F11` - 单步进入（Step Into）
   - `Shift+F11` - 单步跳出（Step Out）
   - `F5` - 继续执行
   - 鼠标悬停在变量上查看值
   - 在"调试控制台"中输入变量名查看值

4. **查看变量**
   - 左侧"变量"面板显示所有局部变量
   - "监视"面板可以添加表达式监视
   - "调用堆栈"显示函数调用链

### 调试渲染进程（Vue 组件）

1. 启动 "Debug Renderer Process" 配置
2. 在 Vue 文件中设置断点
3. 使用浏览器开发者工具的调试功能

## 方法 2：Chrome DevTools（主进程）

1. **启动应用时开启调试端口**
   ```bash
   npm run dev
   ```

2. **打开 Chrome DevTools**
   - 在应用运行时，打开 Chrome 浏览器
   - 访问：`chrome://inspect`
   - 点击 "Configure" 添加 `localhost:9222`
   - 在 "Remote Target" 中找到你的应用，点击 "inspect"

3. **在 Sources 面板中设置断点**
   - 找到 `src/main/ipc/skills.ts`
   - 设置断点并调试

## 方法 3：Console.log 调试（最简单）

已经在代码中添加了大量日志：

```typescript
console.log('[ReadSkills] Starting with dirPath:', dirPath)
console.log('[ReadSkills] API Key provided:', apiKey ? 'YES' : 'NO')
```

### 查看日志

1. **开发模式下**：
   - 日志会输出到启动应用的终端窗口
   - 也可以在应用中按 `F12` 打开开发者工具查看

2. **生产模式下**：
   - Windows: `%APPDATA%\skills-manager\logs`
   - macOS: `~/Library/Logs/skills-manager`
   - Linux: `~/.config/skills-manager/logs`

## 方法 4：使用 debugger 语句

在代码中直接添加 `debugger` 语句：

```typescript
async function readSkills(dirPath: string, apiKey?: string): Promise<Skill[]> {
    debugger; // 程序会在这里暂停
    console.log('[ReadSkills] Starting...')
    // ...
}
```

然后以调试模式启动应用，程序会自动在 `debugger` 处暂停。

## 常见调试场景

### 调试 API Key 传递问题

1. 在 `skills-manager-app/src/renderer/src/views/SkillsManager.vue` 的 `fetchSkills` 函数设置断点
2. 检查 `localStorage.getItem('GEMINI_API_KEY')` 的返回值
3. 在 `skills-manager-app/src/main/ipc/skills.ts` 的 `readSkills` 函数设置断点
4. 检查 `apiKey` 参数的值

### 调试翻译功能

1. 删除一个缓存文件：
   ```powershell
   Remove-Item "E:\AITools\SKillsManager\Skills\electron\.desc_cn.md"
   ```

2. 在 `translateDescription` 函数设置断点
3. 在应用中点击刷新按钮
4. 观察 API 调用过程

### 调试文件读取

1. 在 `readDirTree` 或 `readFile` 函数设置断点
2. 检查文件路径和内容

## 快速调试技巧

### 1. 重启应用
```bash
# 停止当前运行
Ctrl+C

# 重新启动
npm run dev
```

### 2. 清除缓存
```bash
# 清除 Electron 缓存
Remove-Item -Recurse -Force "$env:APPDATA\skills-manager" -ErrorAction SilentlyContinue
```

### 3. 查看完整错误堆栈
在 catch 块中添加：
```typescript
catch (error) {
    console.error('Error details:', error)
    console.error('Stack trace:', error.stack)
}
```

## 推荐的调试流程

1. **先用 console.log 定位问题区域**
2. **在问题区域设置断点**
3. **使用 VS Code 调试器单步执行**
4. **检查变量值和调用堆栈**
5. **修复问题后验证**

## 当前需要调试的问题

API Key 没有被传递到主进程，建议：

1. 在 `SkillsManager.vue` 的 `fetchSkills` 函数设置断点
2. 检查 `localStorage.getItem('GEMINI_API_KEY')` 的值
3. 在 `skills.ts` 的 `readSkills` 函数设置断点
4. 检查 `apiKey` 参数是否正确接收

如果 localStorage 为空，需要：
1. 先访问"设置"页面
2. 确认 API Key 已保存
3. 再回到 Skills 页面刷新
