// File Upload Functionality

let uploadedFiles = [];

function initializeUploader() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const filePreview = document.getElementById('file-preview');
    
    if (!uploadArea || !fileInput || !filePreview) {
        console.error('Upload elements not found in the DOM');
        return;
    }
    
    // Click on upload area opens file picker
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Handle file selection
    fileInput.addEventListener('change', handleFileSelection);
    
    // Drag and drop functionality
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    });
}

function handleFileSelection(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleFiles(files);
    }
}

function handleFiles(files) {
    const fileTypes = ['.pdf', '.png', '.jpg', '.jpeg'];
    let validFiles = [];
    
    // Filter valid files
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (fileTypes.includes(extension)) {
            validFiles.push(file);
        } else {
            showToast(`"${file.name}" is not a supported file type`, 'error');
        }
    }
    
    if (validFiles.length === 0) {
        return;
    }
    
    // Show loading state
    showToast(`Uploading ${validFiles.length} file(s)...`, 'info');
    
    // Prepare form data
    const formData = new FormData();
    validFiles.forEach(file => {
        formData.append('files', file);
    });
    
    // Upload files to server
    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Add uploaded files to our list
            if (data.files && data.files.length > 0) {
                uploadedFiles = uploadedFiles.concat(data.files);
                
                // Update the preview
                updateFilePreview();
                
                // Show success message
                showToast(`${data.files.length} file(s) uploaded successfully!`, 'success');
                
                // Dispatch event that files were uploaded
                document.dispatchEvent(new CustomEvent('filesUploaded', { 
                    detail: uploadedFiles
                }));
            }
        } else {
            showToast(data.message || 'Failed to upload files', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('An error occurred during file upload', 'error');
    });
}

function updateFilePreview() {
    const filePreview = document.getElementById('file-preview');
    if (!filePreview) return;
    
    // Clear previous previews
    filePreview.innerHTML = '';
    
    // Add each file to the preview
    uploadedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        // Determine icon based on file type
        let icon = 'fas fa-file';
        if (file.name.toLowerCase().endsWith('.pdf')) {
            icon = 'fas fa-file-pdf';
        } else if (['.jpg', '.jpeg', '.png'].some(ext => file.name.toLowerCase().endsWith(ext))) {
            icon = 'fas fa-file-image';
        }
        
        fileItem.innerHTML = `
            <i class="${icon}"></i>
            <span>${file.name}</span>
            <span class="remove-file" data-index="${index}">×</span>
        `;
        
        filePreview.appendChild(fileItem);
    });
    
    // Add remove event listeners
    document.querySelectorAll('.remove-file').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const index = parseInt(this.getAttribute('data-index'));
            removeFile(index);
        });
    });
    
    // Show empty state if no files
    if (uploadedFiles.length === 0) {
        filePreview.innerHTML = '<div class="empty-state">No files uploaded yet</div>';
    }
}

function removeFile(index) {
    if (index >= 0 && index < uploadedFiles.length) {
        const fileName = uploadedFiles[index].name;
        
        // Remove file from server
        fetch('/api/delete-file', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filename: uploadedFiles[index].path
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Remove from our list
                uploadedFiles.splice(index, 1);
                updateFilePreview();
                showToast(`"${fileName}" removed`, 'info');
                
                // Dispatch event that files were updated
                document.dispatchEvent(new CustomEvent('filesUploaded', { 
                    detail: uploadedFiles
                }));
            } else {
                showToast(data.message || 'Failed to remove file', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred while removing the file', 'error');
        });
    }
}

function getUploadedFiles() {
    return uploadedFiles;
}
