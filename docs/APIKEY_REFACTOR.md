# API KEY 获取方式重构

## 修改说明

将所有使用 `localStorage.getItem('GEMINI_API_KEY')` 的代码改为从 `app-settings.json` 配置文件获取。

## 修改原因

- 统一配置管理：所有配置都应该通过 `app-settings.json` 管理
- 避免数据不一致：localStorage 和配置文件可能出现不同步的情况
- 更好的持久化：配置文件更可靠，不会因为浏览器缓存清理而丢失

## 修改文件

### 1. SkillsManager.vue

**位置 1：loadSkills 函数**
```typescript
// 修改前
const apiKey = localStorage.getItem('GEMINI_API_KEY')

// 修改后
const settings = await window.api.getAppSettings()
const apiKey = settings?.ai?.geminiApiKey || ''
```

**位置 2：regenerateIcon 函数**
```typescript
// 修改前
const apiKey = localStorage.getItem('GEMINI_API_KEY')

// 修改后
const settings = await window.api.getAppSettings()
const apiKey = settings?.ai?.geminiApiKey || ''
```

### 2. SkillEditor.vue

**位置：triggerTranslation 函数**
```typescript
// 修改前
const apiKey = localStorage.getItem('GEMINI_API_KEY')

// 修改后
const settings = await window.api.getAppSettings()
const apiKey = settings?.ai?.geminiApiKey || ''
```

## API KEY 配置路径

- 配置文件：`C:\Users\<用户名>\AppData\Roaming\skills-manager-app\data\app-settings.json`
- 配置结构：
```json
{
  "ai": {
    "geminiApiKey": "your-api-key-here"
  }
}
```

## 使用方式

1. 在应用的"设置"页面输入 Gemini API Key
2. 点击"保存设置"按钮
3. API Key 会自动保存到 `app-settings.json`
4. 所有功能会自动从配置文件读取 API Key

## 测试工具

运行以下命令查看当前配置的 API Key：
```bash
node skills-manager-app/test/show-api-key.js
```

## 注意事项

- 所有获取 API Key 的函数都需要改为 `async` 函数
- 使用 `await window.api.getAppSettings()` 获取配置
- 使用可选链和默认值：`settings?.ai?.geminiApiKey || ''`
