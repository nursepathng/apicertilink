// Dashboard page functionality
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!Utils.requireAuth()) return;
    
    // Load certificates
    await loadCertificates();
    
    // Setup logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Setup upload button
document.getElementById('uploadBtn').addEventListener('click', () => {
    const modal = document.getElementById('uploadModal');
    modal.classList.remove('hidden');
    modal.classList.add('active');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    resetUploadForm();
});

// Setup close modal
document.getElementById('closeModal').addEventListener('click', () => {
    const modal = document.getElementById('uploadModal');
    modal.classList.add('hidden');
    modal.classList.remove('active');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    resetUploadForm();
});

// Close modal on outside click
document.getElementById('uploadModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        const modal = document.getElementById('uploadModal');
        modal.classList.add('hidden');
        modal.classList.remove('active');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        resetUploadForm();
    }
});
    
    // Setup file input change for preview
    document.getElementById('certFile').addEventListener('change', handleFilePreview);
    
    // Setup remove file button
    document.getElementById('removeFileBtn').addEventListener('click', removeSelectedFile);
    
    // Setup upload form
    document.getElementById('uploadForm').addEventListener('submit', handleUpload);
});

// Reset upload form
function resetUploadForm() {
    const form = document.getElementById('uploadForm');
    form.reset();
    document.getElementById('uploadProgress').style.display = 'none';
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('filePreviewContainer').style.display = 'none';
    document.getElementById('filePreview').src = '';
    document.getElementById('filePreview').style.display = 'none';
    document.getElementById('pdfPreview').style.display = 'none';
    document.getElementById('fileNameDisplay').textContent = '';
    document.getElementById('fileSizeDisplay').textContent = '';
    document.getElementById('removeFileBtn').style.display = 'none';
}

// Handle file preview
function handleFilePreview(e) {
    const file = e.target.files[0];
    if (!file) {
        removeSelectedFile();
        return;
    }
    
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
        Utils.showAlert('File size must be less than 10MB', 'error');
        e.target.value = '';
        removeSelectedFile();
        return;
    }
    
    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
        Utils.showAlert('Invalid file type. Only PDF, JPG, JPEG, and PNG are allowed.', 'error');
        e.target.value = '';
        removeSelectedFile();
        return;
    }
    
    // Show file info
    const fileName = file.name;
    const fileSize = (file.size / 1024 / 1024).toFixed(2) + ' MB';
    document.getElementById('fileNameDisplay').textContent = fileName;
    document.getElementById('fileSizeDisplay').textContent = fileSize;
    document.getElementById('removeFileBtn').style.display = 'inline-block';
    
    // Show preview
    const previewContainer = document.getElementById('filePreviewContainer');
    const imgPreview = document.getElementById('filePreview');
    const pdfPreview = document.getElementById('pdfPreview');
    
    previewContainer.style.display = 'block';
    
    if (file.type.startsWith('image/')) {
        // Image preview
        imgPreview.style.display = 'block';
        pdfPreview.style.display = 'none';
        const reader = new FileReader();
        reader.onload = (e) => {
            imgPreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
        // PDF preview
        imgPreview.style.display = 'none';
        pdfPreview.style.display = 'block';
        pdfPreview.innerHTML = `
            <div class="pdf-preview-content">
                <div class="pdf-icon">📄</div>
                <p>${fileName}</p>
                <p class="pdf-size">${fileSize}</p>
                <a href="#" class="btn btn-secondary" onclick="window.open('${URL.createObjectURL(file)}', '_blank')">
                    Preview PDF
                </a>
            </div>
        `;
    }
}

// Remove selected file
function removeSelectedFile() {
    const fileInput = document.getElementById('certFile');
    fileInput.value = '';
    document.getElementById('filePreviewContainer').style.display = 'none';
    document.getElementById('filePreview').src = '';
    document.getElementById('filePreview').style.display = 'none';
    document.getElementById('pdfPreview').style.display = 'none';
    document.getElementById('fileNameDisplay').textContent = '';
    document.getElementById('fileSizeDisplay').textContent = '';
    document.getElementById('removeFileBtn').style.display = 'none';
}

// Load certificates
async function loadCertificates() {
    try {
        const data = await API.certificates.getAll();
        const grid = document.getElementById('certificateGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (data.certificates && data.certificates.length > 0) {
            grid.innerHTML = data.certificates.map(cert => createCertificateCard(cert)).join('');
            grid.style.display = 'grid';
            emptyState.style.display = 'none';
        } else {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
        }
    } catch (error) {
        Utils.showAlert('Failed to load certificates: ' + error.message, 'error');
    }
}

// Create certificate card HTML
function createCertificateCard(cert) {
    const icon = Utils.getFileIcon(cert.fileType);
    const typeLabel = Utils.getFileTypeLabel(cert.fileType);
    const date = Utils.formatDate(cert.uploadedAt);
    
    // Determine preview content
    let previewContent = '';
    if (cert.fileType === 'pdf') {
        previewContent = `
            <iframe
                src="${cert.fileUrl}"
                class="cert-preview-pdf"
                frameborder="0">
            </iframe>
        `;
    } else {
        previewContent = `
            <img src="${cert.fileUrl}" alt="${cert.title}" class="cert-preview-image" 
                 onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'cert-preview-error\\'>🖼️<br><small>Preview not available</small></div>'">
        `;
    }
    
    return `
        <div class="certificate-card" data-id="${cert.id}">
            <div class="cert-preview-container">
                ${previewContent}
            </div>
            <div class="cert-details">
                <div class="cert-icon">${icon}</div>
                <div class="cert-title">${cert.title}</div>
                <div class="cert-type">${typeLabel}</div>
                <div class="cert-date">Uploaded: ${date}</div>
                <div class="cert-actions">
                    <a href="${cert.fileUrl}" target="_blank" class="btn btn-secondary">View Full</a>
                    <button onclick="deleteCertificate('${cert.id}')" class="btn btn-danger">Delete</button>
                </div>
            </div>
        </div>
    `;
}

// Handle certificate upload
async function handleUpload(e) {
    e.preventDefault();
    
    const title = document.getElementById('certTitle').value.trim();
    const fileInput = document.getElementById('certFile');
    const file = fileInput.files[0];
    
    if (!title) {
        Utils.showAlert('Please enter a certificate title', 'error');
        return;
    }
    
    if (!file) {
        Utils.showAlert('Please select a file to upload', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const progressBar = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading...';
        progressBar.style.display = 'block';
        
        const response = await API.certificates.upload(title, file, (progress) => {
            progressFill.style.width = `${progress}%`;
        });
        
        Utils.showAlert('Certificate uploaded successfully!', 'success');
        
        // Reset form and close modal
        resetUploadForm();
        document.getElementById('uploadModal').classList.remove('active');
        
        // Reload certificates
        await loadCertificates();
        
    } catch (error) {
        Utils.showAlert('Upload failed: ' + error.message, 'error');
        progressFill.style.width = '0%';
        progressBar.style.display = 'none';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Upload';
    }
}

// Delete certificate
async function deleteCertificate(id) {
    if (!confirm('Are you sure you want to delete this certificate?')) {
        return;
    }
    
    try {
        await API.certificates.delete(id);
        Utils.showAlert('Certificate deleted successfully!', 'success');
        await loadCertificates();
    } catch (error) {
        Utils.showAlert('Failed to delete certificate: ' + error.message, 'error');
    }
}

// Handle logout
async function handleLogout(e) {
    e.preventDefault();
    
    try {
        await API.auth.logout();
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    Utils.removeToken();
    Utils.removeUser();
    window.location.href = 'index.html';
}