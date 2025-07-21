const { parse, stringify } = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');

// 模拟"数据库" - 实际应用中应该使用真实数据库
let database = {
    positive: [],
    negative: [],
    nonCorrelated: []
};

// 从模拟数据库加载现有数据
function loadDatabase() {
    try {
        // 这里应该是从真实数据库加载的逻辑
        // 为了示例，我们返回模拟数据
        return {
            positive: [],
            negative: [],
            nonCorrelated: []
        };
    } catch (error) {
        console.error('加载数据库失败:', error);
        return {
            positive: [],
            negative: [],
            nonCorrelated: []
        };
    }
}

// 保存数据到模拟数据库
function saveToDatabase(data) {
    try {
        // 这里应该是保存到真实数据库的逻辑
        // 为了示例，我们只是合并到内存中的数据
        database.positive = database.positive.concat(data.positive);
        database.negative = database.negative.concat(data.negative);
        database.nonCorrelated = database.nonCorrelated.concat(data.nonCorrelated);
        
        return true;
    } catch (error) {
        console.error('保存到数据库失败:', error);
        return false;
    }
}

exports.handler = async (event) => {
    // 加载现有数据
    database = loadDatabase();
    
    try {
        // 从multipart表单数据中解析文件
        const boundary = event.headers['content-type'].split('=')[1];
        const body = Buffer.from(event.body, 'base64').toString('binary');
        const parts = body.split(`--${boundary}`);
        
        const files = {
            positive: null,
            negative: null,
            nonCorrelated: null
        };
        
        // 解析每个部分
        parts.forEach(part => {
            if (part.includes('filename="') && part.includes('name="')) {
                const nameMatch = part.match(/name="([^"]+)"/);
                const filenameMatch = part.match(/filename="([^"]+)"/);
                const contentMatch = part.match(/\r\n\r\n([\s\S]*)\r\n--/);
                
                if (nameMatch && filenameMatch && contentMatch) {
                    const name = nameMatch[1];
                    const content = contentMatch[1].trim();
                    files[name] = content;
                }
            }
        });
        
        // 检查所有文件是否都已上传
        if (!files.positive || !files.negative || !files.nonCorrelated) {
            throw new Error('请上传所有分类的文件');
        }
        
        // 解析CSV文件
        const parsedData = {
            positive: parse(files.positive, { columns: true, skip_empty_lines: true }),
            negative: parse(files.negative, { columns: true, skip_empty_lines: true }),
            nonCorrelated: parse(files.nonCorrelated, { columns: true, skip_empty_lines: true })
        };
        
        // 为每条数据添加分类标签
        parsedData.positive.forEach(row => row.category = 'positive');
        parsedData.negative.forEach(row => row.category = 'negative');
        parsedData.nonCorrelated.forEach(row => row.category = 'nonCorrelated');
        
        // 合并数据
        const mergedData = [
            ...parsedData.positive,
            ...parsedData.negative,
            ...parsedData.nonCorrelated
        ];
        
        // 保存到数据库
        if (!saveToDatabase(parsedData)) {
            throw new Error('保存数据失败');
        }
        
        // 准备响应数据
        const responseData = {
            success: true,
            positiveCount: parsedData.positive.length,
            negativeCount: parsedData.negative.length,
            nonCorrelatedCount: parsedData.nonCorrelated.length,
            totalCount: mergedData.length,
            sampleData: mergedData.slice(0, 5), // 返回前5条作为示例
            mergedData: mergedData
        };
        
        return {
            statusCode: 200,
            body: JSON.stringify(responseData),
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: error.message
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        };
    }
};