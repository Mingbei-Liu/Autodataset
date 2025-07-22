const { parse } = require('csv-parse/sync');

// 内存数据库
const database = {
    positive: [],
    negative: [],
    nonCorrelated: []
};

exports.handler = async (event) => {
    // 只处理POST请求
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: '只允许POST请求' })
        };
    }

    try {
        // 检查内容类型
        const contentType = event.headers['content-type'] || '';
        if (!contentType.includes('multipart/form-data')) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: '无效的内容类型，需要multipart/form-data' })
            };
        }

        // 解析表单数据
        const boundary = contentType.split('boundary=')[1];
        const body = Buffer.from(event.body, 'base64');
        const parts = body.toString().split(`--${boundary}`);

        const files = {};
        parts.forEach(part => {
            const match = part.match(/name="([^"]+)"[\s\S]*?filename="([^"]+)"[\s\S]*?\r\n\r\n([\s\S]*?)\r\n--/);
            if (match) {
                files[match[1]] = match[3].trim();
            }
        });

        // 检查必需文件
        const required = ['positive', 'negative', 'nonCorrelated'];
        for (const field of required) {
            if (!files[field]) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: `缺少${field}文件` })
                };
            }
        }

        // 处理CSV数据
        const results = {};
        for (const [field, content] of Object.entries(files)) {
            try {
                results[field] = parse(content, {
                    columns: true,
                    skip_empty_lines: true,
                    trim: true
                });
                // 添加分类标签
                results[field].forEach(row => row.category = field);
                // 存入"数据库"
                database[field].push(...results[field]);
            } catch (error) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: `${field}文件解析失败: ${error.message}` })
                };
            }
        }

        // 返回成功响应
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                counts: {
                    positive: results.positive.length,
                    negative: results.negative.length,
                    nonCorrelated: results.nonCorrelated.length
                },
                sample: [
                    ...results.positive.slice(0, 1),
                    ...results.negative.slice(0, 1),
                    ...results.nonCorrelated.slice(0, 1)
                ]
            })
        };

    } catch (error) {
        console.error('服务器错误:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: '处理请求时出错',
                details: error.message 
            })
        };
    }
};