/**
 * 测试 Gemini 图标生成功能
 * 
 * 使用方法：
 * 1. 设置环境变量 GEMINI_API_KEY
 * 2. 运行: node test/test-icon-generation.js
 */

const fs = require('fs');
const path = require('path');

// 从环境变量或命令行参数获取 API Key
const API_KEY = process.env.GEMINI_API_KEY || process.argv[2];

if (!API_KEY) {
    console.error('错误: 请提供 Gemini API Key');
    console.error('使用方法: node test/test-icon-generation.js YOUR_API_KEY');
    console.error('或设置环境变量: set GEMINI_API_KEY=YOUR_API_KEY');
    process.exit(1);
}

console.log('API Key:', API_KEY.substring(0, 10) + '...');

/**
 * 测试 1: 列出可用的模型
 */
async function listModels() {
    console.log('\n=== 测试 1: 列出可用的模型 ===');
    
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API 错误:', response.status, errorText);
            return;
        }
        
        const data = await response.json();
        
        console.log('可用的模型:');
        if (data.models) {
            // 筛选出图像相关的模型
            const imageModels = data.models.filter(m => 
                m.name.includes('imagen') || 
                m.name.includes('image') ||
                m.displayName?.toLowerCase().includes('image')
            );
            
            if (imageModels.length > 0) {
                console.log('\n图像生成相关模型:');
                imageModels.forEach(model => {
                    console.log(`  - ${model.name}`);
                    console.log(`    显示名称: ${model.displayName || 'N/A'}`);
                    console.log(`    描述: ${model.description || 'N/A'}`);
                    console.log(`    支持的方法: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
                    console.log('');
                });
            } else {
                console.log('未找到图像生成模型');
                console.log('\n所有可用模型:');
                data.models.slice(0, 10).forEach(model => {
                    console.log(`  - ${model.name} (${model.displayName})`);
                });
            }
        }
    } catch (error) {
        console.error('列出模型失败:', error);
    }
}

/**
 * 测试 2: 使用文本生成模型生成图标描述
 */
async function generateIconWithText() {
    console.log('\n=== 测试 2: 使用文本模型生成图标 SVG ===');
    
    try {
        const skillName = 'Excel Helper';
        const skillDesc = '帮助处理 Excel 文件的工具';
        
        const prompt = `Generate a simple SVG icon code for a coding skill named "${skillName}". 
Description: ${skillDesc}. 
Requirements:
- Output ONLY the SVG code, no explanation
- Size: 40x40 viewBox
- Style: flat design, minimalist, professional
- Use vibrant colors
- Icon only, no text
- Must be valid SVG that can be used as data URI`;
        
        // 使用 gemini-2.5-flash 模型（支持 generateContent）
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
        
        const body = {
            contents: [{
                role: 'user',
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.9,
                maxOutputTokens: 2048
            }
        };
        
        console.log('发送请求...');
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API 错误:', response.status, errorText);
            return;
        }
        
        const data = await response.json();
        const svgCode = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        if (!svgCode) {
            console.error('未获取到 SVG 代码');
            return;
        }
        
        console.log('生成的 SVG 代码:');
        console.log(svgCode);
        
        // 清理 SVG 代码（移除 markdown 代码块标记）
        let cleanSvg = svgCode.trim();
        cleanSvg = cleanSvg.replace(/^```svg\s*/i, '');
        cleanSvg = cleanSvg.replace(/^```\s*/i, '');
        cleanSvg = cleanSvg.replace(/\s*```$/i, '');
        cleanSvg = cleanSvg.trim();
        
        // 转换为 data URI
        const dataUri = `data:image/svg+xml;base64,${Buffer.from(cleanSvg).toString('base64')}`;
        
        console.log('\nData URI (前 100 字符):');
        console.log(dataUri.substring(0, 100) + '...');
        
        // 保存到文件
        const outputDir = path.join(__dirname, 'output');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const svgPath = path.join(outputDir, 'test-icon.svg');
        const dataUriPath = path.join(outputDir, 'test-icon-datauri.txt');
        
        fs.writeFileSync(svgPath, cleanSvg, 'utf8');
        fs.writeFileSync(dataUriPath, dataUri, 'utf8');
        
        console.log(`\nSVG 已保存到: ${svgPath}`);
        console.log(`Data URI 已保存到: ${dataUriPath}`);
        console.log('你可以在浏览器中打开 SVG 文件查看效果');
        
    } catch (error) {
        console.error('生成图标失败:', error);
    }
}

/**
 * 测试 3: 尝试使用 Nano Banana 图像生成模型
 */
async function generateImageWithNanoBanana() {
    console.log('\n=== 测试 3: 使用 Nano Banana 生成图标 ===');
    
    try {
        const skillName = 'Excel Helper';
        const skillDesc = '帮助处理 Excel 文件的工具';
        
        const prompt = `A simple, clean, minimalist icon for a coding skill: ${skillName}. ${skillDesc}. Flat design, professional, vibrant colors, 40x40 pixels, icon only, no text.`;
        
        // 使用 gemini-2.5-flash-image (Nano Banana)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`;
        
        const body = {
            contents: [{
                role: 'user',
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.9
            }
        };
        
        console.log('发送请求到 Nano Banana...');
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API 错误:', response.status, errorText);
            return;
        }
        
        const data = await response.json();
        console.log('响应数据:', JSON.stringify(data, null, 2));
        
        // 检查是否有图像数据
        const parts = data?.candidates?.[0]?.content?.parts || [];
        
        for (const part of parts) {
            if (part.inlineData) {
                const imageData = part.inlineData.data;
                const mimeType = part.inlineData.mimeType;
                
                console.log(`\n找到图像数据！MIME 类型: ${mimeType}`);
                console.log(`数据长度: ${imageData.length} 字符`);
                
                // 转换为 data URI
                const dataUri = `data:${mimeType};base64,${imageData}`;
                
                console.log('Data URI (前 100 字符):');
                console.log(dataUri.substring(0, 100) + '...');
                
                // 保存到文件
                const outputDir = path.join(__dirname, 'output');
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }
                
                const ext = mimeType.includes('png') ? 'png' : 'jpg';
                const imagePath = path.join(outputDir, `test-icon-nanoBanana.${ext}`);
                const dataUriPath = path.join(outputDir, 'test-icon-nanoBanana-datauri.txt');
                
                // 保存图像文件
                const imageBuffer = Buffer.from(imageData, 'base64');
                fs.writeFileSync(imagePath, imageBuffer);
                fs.writeFileSync(dataUriPath, dataUri, 'utf8');
                
                console.log(`\n图像已保存到: ${imagePath}`);
                console.log(`Data URI 已保存到: ${dataUriPath}`);
                console.log('你可以在浏览器中打开图像文件查看效果');
                
                return;
            }
        }
        
        console.log('未找到图像数据');
        
    } catch (error) {
        console.error('生成图标失败:', error);
    }
}

/**
 * 主函数
 */
async function main() {
    console.log('开始测试 Gemini 图标生成功能...\n');
    
    // 测试 1: 列出可用模型
    await listModels();
    
    // 等待 1 秒
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 测试 2: 生成 SVG 图标
    await generateIconWithText();
    
    // 等待 1 秒
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 测试 3: 使用 Nano Banana 生成图标
    await generateImageWithNanoBanana();
    
    console.log('\n测试完成！');
}

main().catch(console.error);
