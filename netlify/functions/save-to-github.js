const { Octokit } = require('@octokit/rest');
const { parse } = require('csv-parse/sync');

exports.handler = async (event) => {
  try {
    // 验证GitHub token
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('缺少GitHub Token配置');
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    // 解析上传的文件
    const boundary = event.headers['content-type'].split('boundary=')[1];
    const body = Buffer.from(event.body, 'base64').toString('utf-8');
    
    const getFileContent = (body, fieldName) => {
      const regex = new RegExp(`name="${fieldName}"[\\s\\S]*?filename="([^"]*)"[\\s\\S]*?\\r\\n\\r\\n([\\s\\S]*?)\\r\\n--`);
      const match = body.match(regex);
      return match ? match[2].trim() : null;
    };

    // 保存文件到GitHub
    const saveToGitHub = async (content, filename) => {
      await octokit.repos.createOrUpdateFileContents({
        owner: 'Mingbei-Liu', // 替换为你的GitHub用户名
        repo: 'Autodataset',       // 替换为你的仓库名
        path: `uploads/${filename}`,
        message: `添加 ${filename}`,
        content: Buffer.from(content).toString('base64'),
        branch: 'main'
      });
    };

    // 处理每个文件
    const files = {
      positive: getFileContent(body, 'positive'),
      negative: getFileContent(body, 'negative'),
      nonCorrelated: getFileContent(body, 'nonCorrelated')
    };

    for (const [type, content] of Object.entries(files)) {
      if (content) {
        await saveToGitHub(content, `${type}-${Date.now()}.csv`);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};