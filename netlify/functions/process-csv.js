const { parse } = require('csv-parse/sync');

exports.handler = async (event) => {
    try {
        // 获取上传的文件
        const file = event.body;
        
        // 解析CSV
        const records = parse(file, {
            columns: true,
            skip_empty_lines: true
        });
        
        // 简单的处理示例：统计行数和列名
        const result = {
            rowCount: records.length,
            columns: records.length > 0 ? Object.keys(records[0]) : [],
            sampleData: records.length > 0 ? records[0] : null
        };
        
        return {
            statusCode: 200,
            body: JSON.stringify(result)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};