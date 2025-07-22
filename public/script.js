document.addEventListener('DOMContentLoaded', function() {
    // DOM 元素引用
    const uploadForm = document.getElementById('uploadForm');
    const resultContainer = document.getElementById('resultContainer');
    const emptyResult = document.getElementById('emptyResult');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    
    // 当前处理的数据缓存
    let currentProcessedData = null;
    
    // 初始化事件监听
    function initEventListeners() {
        uploadForm.addEventListener('submit', handleFormSubmit);
        resetBtn.addEventListener('click', handleReset);
        downloadBtn.addEventListener('click', handleDownload);
    }
    
    // 表单提交处理
    async function handleUpload() {
        const files = {
            positive: document.getElementById('positiveFile').files[0],
            negative: document.getElementById('negativeFile').files[0],
            nonCorrelated: document.getElementById('nonCorrelatedFile').files[0]
        };

        // 验证文件
        for (const [type, file] of Object.entries(files)) {
            if (!file) {
            alert(`请上传 ${type} 文件`);
            return;
            }
            if (!file.name.endsWith('.csv')) {
            alert(`${type} 文件必须是CSV格式`);
            return;
            }
        }

        try {
            const formData = new FormData();
            for (const [type, file] of Object.entries(files)) {
            formData.append(type, file);
            }

            const response = await fetch('/.netlify/functions/save-to-github', {
            method: 'POST',
            body: formData
            });

            if (!response.ok) throw new Error('上传失败');
            alert('文件已成功上传到GitHub');
        } catch (error) {
            console.error('上传错误:', error);
            alert(`上传失败: ${error.message}`);
        }
    }
    
    // 文件验证
    function validateFiles(...files) {
        const missingFiles = files.filter(file => !file);
        if (missingFiles.length > 0) {
            showError('请上传所有分类的CSV文件');
            return false;
        }
        
        const invalidFiles = files.filter(file => {
            return !file.name.endsWith('.csv') && 
                   !file.type.includes('csv') && 
                   file.type !== 'text/csv' && 
                   file.type !== 'application/vnd.ms-excel';
        });
        
        if (invalidFiles.length > 0) {
            showError('请上传有效的CSV文件');
            return false;
        }
        
        return true;
    }
    
    // 显示错误信息
    function showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'alert alert-danger alert-dismissible fade show';
        errorElement.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = uploadForm.parentElement;
        container.insertBefore(errorElement, uploadForm);
        
        // 5秒后自动消失
        setTimeout(() => {
            errorElement.classList.remove('show');
            setTimeout(() => errorElement.remove(), 150);
        }, 5000);
    }
    
    // 设置上传按钮状态
    function setUploadState(state) {
        switch(state) {
            case 'processing':
                uploadBtn.disabled = true;
                uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>处理中...';
                break;
            case 'ready':
                uploadBtn.disabled = false;
                uploadBtn.innerHTML = '<i class="fas fa-cloud-upload-alt me-2"></i>提交所有文件';
                break;
        }
    }
    
    // 显示上传进度条
    function showProgressBars() {
        document.querySelectorAll('.progress').forEach(progress => {
            progress.classList.remove('d-none');
            const bar = progress.querySelector('.progress-bar');
            bar.style.width = '0%';
            bar.style.transition = 'width 0.3s ease';
            
            // 模拟进度动画
            let width = 0;
            const interval = setInterval(() => {
                if (width >= 90) { // 留10%给服务器处理
                    clearInterval(interval);
                } else {
                    width += 5;
                    bar.style.width = width + '%';
                }
            }, 200);
        });
    }
    
    // 隐藏上传进度条
    function hideProgressBars() {
        document.querySelectorAll('.progress').forEach(progress => {
            const bar = progress.querySelector('.progress-bar');
            bar.style.width = '100%';
            
            setTimeout(() => {
                progress.classList.add('d-none');
                bar.style.width = '0%';
            }, 500);
        });
    }
    
    // 显示分析结果
    function displayResults(data) {
        // 更新统计数字
        updateCounter('positiveCount', data.positiveCount);
        updateCounter('negativeCount', data.negativeCount);
        updateCounter('nonCorrelatedCount', data.nonCorrelatedCount);
        
        // 更新数据预览表格
        updatePreviewTable(data.sampleData);
        
        // 显示结果区域
        resultContainer.classList.remove('d-none');
        emptyResult.classList.add('d-none');
    }
    
    // 动画更新计数器
    function updateCounter(id, target) {
        const element = document.getElementById(id);
        const duration = 1000; // 动画持续时间
        const start = 0;
        const increment = target / (duration / 16); // 每16ms增加的值
        
        let current = start;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                clearInterval(timer);
                current = target;
            }
            element.textContent = Math.floor(current);
        }, 16);
    }
    
    // 更新预览表格
    function updatePreviewTable(sampleData) {
        const table = document.getElementById('dataPreview');
        const thead = table.querySelector('thead tr');
        const tbody = table.querySelector('tbody');
        
        // 清空现有内容
        thead.innerHTML = '<th>#</th><th>分类</th>';
        tbody.innerHTML = '';
        
        if (!sampleData || sampleData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="100%" class="text-center text-muted">无数据</td></tr>';
            return;
        }
        
        // 添加列头 (使用第一个样本的键)
        const firstRow = sampleData[0];
        for (const key in firstRow) {
            if (key !== 'category') {
                thead.innerHTML += `<th>${key}</th>`;
            }
        }
        
        // 添加样本数据行
        sampleData.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${index + 1}</td><td>${translateCategory(row.category)}</td>`;
            
            for (const key in row) {
                if (key !== 'category') {
                    tr.innerHTML += `<td>${row[key] || '-'}</td>`;
                }
            }
            
            tbody.appendChild(tr);
        });
    }
    
    // 分类翻译
    function translateCategory(category) {
        const translations = {
            'positive': '正面',
            'negative': '负面',
            'nonCorrelated': '非相关'
        };
        return translations[category] || category;
    }
    
    // 处理下载
    function handleDownload() {
        if (!currentProcessedData || !currentProcessedData.mergedData) {
            showError('没有可下载的数据');
            return;
        }
        
        try {
            downloadCSV(currentProcessedData.mergedData, 'merged_data.csv');
        } catch (error) {
            console.error('下载失败:', error);
            showError('生成下载文件时出错');
        }
    }
    
    // 下载CSV文件
    function downloadCSV(data, filename) {
        // 检查数据
        if (!data || data.length === 0) {
            throw new Error('没有数据可下载');
        }
        
        // 获取所有可能的列
        const allKeys = new Set();
        data.forEach(row => {
            Object.keys(row).forEach(key => allKeys.add(key));
        });
        
        // 创建CSV内容
        const headers = Array.from(allKeys);
        let csvContent = headers.join(',') + '\r\n';
        
        data.forEach(row => {
            const rowValues = headers.map(header => {
                // 处理可能包含逗号的值
                const value = row[header] !== undefined ? row[header] : '';
                return `"${value.toString().replace(/"/g, '""')}"`;
            });
            csvContent += rowValues.join(',') + '\r\n';
        });
        
        // 创建下载链接
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        // 清理
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    // 处理重置
    function handleReset() {
        uploadForm.reset();
        resultContainer.classList.add('d-none');
        emptyResult.classList.remove('d-none');
        currentProcessedData = null;
        
        // 清除所有警告
        document.querySelectorAll('.alert').forEach(alert => {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 150);
        });
    }
    
    // 初始化应用
    initEventListeners();
});