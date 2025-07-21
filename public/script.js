document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const resultContainer = document.getElementById('resultContainer');
    const emptyResult = document.getElementById('emptyResult');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    // 处理表单提交
    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const positiveFile = document.getElementById('positiveFile').files[0];
        const negativeFile = document.getElementById('negativeFile').files[0];
        const nonCorrelatedFile = document.getElementById('nonCorrelatedFile').files[0];
        
        if (!positiveFile || !negativeFile || !nonCorrelatedFile) {
            alert('请上传所有分类的CSV文件');
            return;
        }
        
        // 显示上传进度
        showProgressBars();
        
        try {
            const formData = new FormData();
            formData.append('positive', positiveFile);
            formData.append('negative', negativeFile);
            formData.append('nonCorrelated', nonCorrelatedFile);
            
            const response = await fetch('/.netlify/functions/process-csv', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`服务器错误: ${response.status}`);
            }
            
            const result = await response.json();
            
            // 显示结果
            displayResults(result);
            
        } catch (error) {
            console.error('上传失败:', error);
            alert(`上传失败: ${error.message}`);
        } finally {
            hideProgressBars();
        }
    });
    
    // 显示上传进度条
    function showProgressBars() {
        document.querySelectorAll('.progress').forEach(progress => {
            progress.classList.remove('d-none');
            const bar = progress.querySelector('.progress-bar');
            bar.style.width = '0%';
            
            // 模拟进度动画
            let width = 0;
            const interval = setInterval(() => {
                if (width >= 100) {
                    clearInterval(interval);
                } else {
                    width += 5;
                    bar.style.width = width + '%';
                }
            }, 100);
        });
    }
    
    // 隐藏上传进度条
    function hideProgressBars() {
        document.querySelectorAll('.progress').forEach(progress => {
            progress.classList.add('d-none');
        });
    }
    
    // 显示分析结果
    function displayResults(data) {
        // 更新统计数字
        document.getElementById('positiveCount').textContent = data.positiveCount;
        document.getElementById('negativeCount').textContent = data.negativeCount;
        document.getElementById('nonCorrelatedCount').textContent = data.nonCorrelatedCount;
        
        // 更新数据预览表格
        updatePreviewTable(data.sampleData);
        
        // 显示结果区域
        resultContainer.classList.remove('d-none');
        emptyResult.classList.add('d-none');
        
        // 设置下载按钮
        downloadBtn.onclick = function() {
            downloadMergedData(data.mergedData);
        };
    }
    
    // 更新预览表格
    function updatePreviewTable(sampleData) {
        const table = document.getElementById('dataPreview');
        const thead = table.querySelector('thead tr');
        const tbody = table.querySelector('tbody');
        
        // 清空现有内容
        thead.innerHTML = '<th>#</th><th>分类</th>';
        tbody.innerHTML = '';
        
        if (!sampleData || sampleData.length === 0) return;
        
        // 添加列头 (使用第一个样本的键)
        const firstRow = sampleData[0];
        for (const key in firstRow) {
            if (key !== 'category') { // 跳过分类列
                thead.innerHTML += `<th>${key}</th>`;
            }
        }
        
        // 添加样本数据行
        sampleData.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${index + 1}</td><td>${row.category}</td>`;
            
            for (const key in row) {
                if (key !== 'category') {
                    tr.innerHTML += `<td>${row[key]}</td>`;
                }
            }
            
            tbody.appendChild(tr);
        });
    }
    
    // 下载合并数据
    function downloadMergedData(data) {
        // 将数据转换为CSV字符串
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // 添加标题行
        const headers = Object.keys(data[0]);
        csvContent += headers.join(",") + "\r\n";
        
        // 添加数据行
        data.forEach(row => {
            const values = headers.map(header => row[header]);
            csvContent += values.join(",") + "\r\n";
        });
        
        // 创建下载链接
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "merged_data.csv");
        document.body.appendChild(link);
        
        // 触发下载
        link.click();
        document.body.removeChild(link);
    }
    
    // 重置表单
    resetBtn.addEventListener('click', function() {
        uploadForm.reset();
        resultContainer.classList.add('d-none');
        emptyResult.classList.remove('d-none');
    });
});