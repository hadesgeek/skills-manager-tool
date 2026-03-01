# 图标生成测试

## 使用方法

1. 运行测试脚本：
```bash
node test/test-icon-generation.js YOUR_GEMINI_API_KEY
```

2. 或者设置环境变量后运行：
```bash
set GEMINI_API_KEY=YOUR_GEMINI_API_KEY
node test/test-icon-generation.js
```

## 测试内容

1. 列出 Gemini 可用的模型（查找图像生成相关模型）
2. 使用文本模型生成 SVG 图标代码
3. 生成 Emoji 图标建议

## 输出

测试结果会保存在 `test/output/` 目录：
- `test-icon.svg` - 生成的 SVG 图标文件
- `test-icon-datauri.txt` - SVG 的 Data URI 格式（可直接用于 HTML）
