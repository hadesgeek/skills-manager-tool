# 安全指南

## 🔐 API Key 安全

### 存储位置

API Key 存储在以下位置，**不会被 Git 跟踪**：

1. **应用设置**：`userData/data/app-settings.json`（已在 `.gitignore` 中）
2. **浏览器缓存**：`localStorage.getItem('GEMINI_API_KEY')`（仅会话期间）

### 使用建议

1. **不要硬编码 API Key**
   ```javascript
   // ❌ 错误示例
   const API_KEY = "AIzaSyCHLSIgw32GieV6CdttdyIrZKaZGvsl0YU"
   
   // ✅ 正确示例
   const API_KEY = process.env.GEMINI_API_KEY || localStorage.getItem('GEMINI_API_KEY')
   ```

2. **使用环境变量**
   ```bash
   # Windows
   set GEMINI_API_KEY=your-api-key-here
   
   # Linux/macOS
   export GEMINI_API_KEY=your-api-key-here
   ```

3. **测试脚本**
   - 测试脚本应该从命令行参数或环境变量读取 API Key
   - 不要在测试脚本中硬编码 API Key

### 提交前检查

在提交代码前，请确保：

- [ ] 没有硬编码的 API Key
- [ ] `.gitignore` 包含所有敏感文件
- [ ] 测试文件不包含真实的 API Key
- [ ] 文档中的示例使用占位符（如 `your-api-key-here`）

## 🛡️ 数据隐私

### 本地存储

所有用户数据存储在本地：

- **配置文件**：`%APPDATA%/skills-manager-app/data/`
- **图标缓存**：`%APPDATA%/skills-manager-app/data/tools-imgs/`
- **翻译缓存**：Skills 目录下的 `.desc_cn.md` 文件

### 网络请求

应用仅在以下情况下发送网络请求：

1. **AI 翻译**：调用 Gemini API 翻译 Skill 描述
2. **图标生成**：调用 Gemini API 生成图标

**不会收集或上传**：
- 用户的 Skills 内容
- 工具配置信息
- 使用统计数据

## 🔍 安全审计

### 检查 API Key 泄露

运行以下命令检查代码中是否有 API Key：

```bash
# 搜索可能的 API Key 模式
git grep -i "AIzaSy"
git grep -i "api.*key.*="
git grep -i "gemini.*key"
```

### 检查敏感文件

确保以下文件不在 Git 仓库中：

```bash
git ls-files | grep -E "(app-settings|tools-state|.*-config\.json)"
```

如果有输出，说明敏感文件被跟踪，需要移除：

```bash
git rm --cached path/to/sensitive-file.json
```

## 📋 安全清单

### 开发者

- [ ] 不在代码中硬编码 API Key
- [ ] 使用环境变量或配置文件管理敏感信息
- [ ] 定期检查 `.gitignore` 是否完整
- [ ] 提交前运行安全审计命令

### 用户

- [ ] 妥善保管 API Key，不要分享给他人
- [ ] 定期更换 API Key
- [ ] 使用 API Key 限制功能（如 IP 白名单）
- [ ] 监控 API 使用量，及时发现异常

## 🚨 发现安全问题？

如果你发现安全漏洞，请：

1. **不要公开披露**：不要在 Issue 或 PR 中公开安全问题
2. **私下联系**：发送邮件至 security@example.com
3. **提供详情**：包括漏洞描述、影响范围、复现步骤

我们会在 48 小时内响应，并在修复后公开致谢。

## 📚 相关资源

- [Gemini API 安全最佳实践](https://ai.google.dev/docs/security)
- [Electron 安全指南](https://www.electronjs.org/docs/latest/tutorial/security)
- [OWASP 安全编码实践](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)

---

**记住：安全是每个人的责任！**
