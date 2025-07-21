document.getElementById('uploadBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('请先选择CSV文件');
        return;
    }

    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '处理中...';
    
    try {
        const formData = new FormData();
        formData.append('csvFile', file);
        
        const response = await fetch('/.netlify/functions/process-csv', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        resultDiv.innerHTML = `处理成功！<pre>${JSON.stringify(data, null, 2)}</pre>`;
    } catch (error) {
        resultDiv.innerHTML = `错误: ${error.message}`;
    }
});