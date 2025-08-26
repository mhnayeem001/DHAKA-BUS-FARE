// Admin Panel JavaScript

// Global variables
let isLoggedIn = false;

// DOM Elements
const loginSection = document.getElementById('loginSection');
const adminPanel = document.getElementById('adminPanel');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const uploadForm = document.getElementById('uploadForm');
const uploadProgress = document.getElementById('uploadProgress');
const uploadResult = document.getElementById('uploadResult');
const currentDataInfo = document.getElementById('currentDataInfo');
const dataPreviewBody = document.getElementById('dataPreviewBody');
const downloadDataBtn = document.getElementById('downloadDataBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminPanel();
});

function initializeAdminPanel() {
    // Check if already logged in (session storage)
    const savedLogin = sessionStorage.getItem('adminLoggedIn');
    if (savedLogin === 'true') {
        showAdminPanel();
    }
    
    setupEventListeners();
    loadCurrentDataInfo();
}

function setupEventListeners() {
    // Login form
    loginForm.addEventListener('submit', handleLogin);
    
    // Upload form
    uploadForm.addEventListener('submit', handleFileUpload);
    
    // Download button
    downloadDataBtn.addEventListener('click', downloadCurrentData);
    
    // Logout button
    logoutBtn.addEventListener('click', handleLogout);
    
    // File input change
    const fileInput = document.getElementById('excelFile');
    fileInput.addEventListener('change', validateFileInput);
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showLoginError('Please enter both username and password.');
        return;
    }
    
    try {
        showLoginLoading(true);
        
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            sessionStorage.setItem('adminLoggedIn', 'true');
            showAdminPanel();
            hideLoginError();
        } else {
            showLoginError(result.error || 'Invalid credentials');
        }
    } catch (error) {
        console.error('Login error:', error);
        showLoginError('Login failed. Please check your connection and try again.');
    } finally {
        showLoginLoading(false);
    }
}

function showAdminPanel() {
    isLoggedIn = true;
    loginSection.style.display = 'none';
    adminPanel.style.display = 'block';
    loadCurrentDataInfo();
    loadDataPreview();
}

function hideAdminPanel() {
    isLoggedIn = false;
    adminPanel.style.display = 'none';
    loginSection.style.display = 'block';
    sessionStorage.removeItem('adminLoggedIn');
    
    // Clear form
    loginForm.reset();
}

function showLoginLoading(loading) {
    const loginBtn = document.getElementById('loginBtn');
    
    if (loading) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Logging in...';
    } else {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Login';
    }
}

function showLoginError(message) {
    loginError.textContent = message;
    loginError.style.display = 'block';
}

function hideLoginError() {
    loginError.style.display = 'none';
}

function validateFileInput() {
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];
    
    if (!file) return;
    
    const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!allowedTypes.includes(file.type)) {
        showUploadResult('Please select a valid Excel file (.xlsx or .xls)', 'error');
        fileInput.value = '';
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
        showUploadResult('File size must be less than 5MB', 'error');
        fileInput.value = '';
        return;
    }
    
    // Clear previous results
    uploadResult.innerHTML = '';
}

async function handleFileUpload(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showUploadResult('Please select a file to upload.', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('excelFile', file);
    formData.append('username', 'admin'); // Include credentials for multer middleware
    formData.append('password', 'admin123');
    
    try {
        showUploadProgress(true);
        
        const response = await fetch('/api/admin/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showUploadResult(
                `✅ Success! Excel file uploaded and converted to JSON.<br>
                📊 Total Routes: ${result.data.totalRoutes}<br>
                🚌 Total Stops: ${result.data.totalStops}<br>
                🕐 Last Updated: ${new Date(result.data.lastUpdated).toLocaleString()}`,
                'success'
            );
            
            // Refresh data info and preview
            setTimeout(() => {
                loadCurrentDataInfo();
                loadDataPreview();
            }, 1000);
            
            // Clear file input
            fileInput.value = '';
        } else {
            showUploadResult(`❌ Error: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showUploadResult('❌ Upload failed. Please check your connection and try again.', 'error');
    } finally {
        showUploadProgress(false);
    }
}

function showUploadProgress(show) {
    if (show) {
        uploadProgress.style.display = 'block';
        document.getElementById('uploadBtn').disabled = true;
        document.getElementById('uploadBtn').innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
    } else {
        uploadProgress.style.display = 'none';
        document.getElementById('uploadBtn').disabled = false;
        document.getElementById('uploadBtn').innerHTML = '<i class="fas fa-upload me-2"></i>Upload and Convert to JSON';
    }
}

function showUploadResult(message, type) {
    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    uploadResult.innerHTML = `
        <div class="alert ${alertClass} alert-dismissible fade show">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

async function loadCurrentDataInfo() {
    try {
        const response = await fetch('/api/fare-data');
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.routes && data.routes.length > 0) {
                currentDataInfo.innerHTML = `
                    <div class="row text-center">
                        <div class="col-6">
                            <div class="bg-primary text-white rounded p-2 mb-2">
                                <h4 class="mb-0">${data.totalRoutes || data.routes.length}</h4>
                                <small>Total Routes</small>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="bg-success text-white rounded p-2 mb-2">
                                <h4 class="mb-0">${data.totalStops || data.stops.length}</h4>
                                <small>Total Stops</small>
                            </div>
                        </div>
                    </div>
                    <hr>
                    <div class="text-center">
                        <small class="text-muted">
                            <i class="fas fa-clock me-1"></i>
                            Last Updated:<br>
                            ${data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'Unknown'}
                        </small>
                    </div>
                `;
            } else {
                currentDataInfo.innerHTML = `
                    <div class="text-center text-muted">
                        <i class="fas fa-database fa-2x mb-2"></i>
                        <p class="mb-0">No data available</p>
                        <small>Upload an Excel file to get started</small>
                    </div>
                `;
            }
        } else {
            throw new Error('Failed to load data info');
        }
    } catch (error) {
        console.error('Error loading data info:', error);
        currentDataInfo.innerHTML = `
            <div class="text-center text-danger">
                <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                <p class="mb-0">Failed to load data info</p>
            </div>
        `;
    }
}

async function loadDataPreview() {
    try {
        const response = await fetch('/api/fare-data');
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.routes && data.routes.length > 0) {
                // Show latest 10 routes
                const previewRoutes = data.routes.slice(0, 10);
                
                dataPreviewBody.innerHTML = previewRoutes.map(route => `
                    <tr>
                        <td>${route.from}</td>
                        <td>${route.to}</td>
                        <td>${route.distance} km</td>
                        <td>৳${route.fare}</td>
                    </tr>
                `).join('');
            } else {
                dataPreviewBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center text-muted">No data available</td>
                    </tr>
                `;
            }
        } else {
            throw new Error('Failed to load data preview');
        }
    } catch (error) {
        console.error('Error loading data preview:', error);
        dataPreviewBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-danger">Failed to load data preview</td>
            </tr>
        `;
    }
}

async function downloadCurrentData() {
    try {
        const response = await fetch('/api/fare-data');
        
        if (response.ok) {
            const data = await response.json();
            
            // Create and download JSON file
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `fare-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showNotification('Data downloaded successfully!', 'success');
        } else {
            throw new Error('Failed to download data');
        }
    } catch (error) {
        console.error('Download error:', error);
        showNotification('Failed to download data.', 'error');
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        hideAdminPanel();
        showNotification('Logged out successfully.', 'info');
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
    
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Periodic data refresh (every 30 seconds when logged in)
setInterval(() => {
    if (isLoggedIn) {
        loadCurrentDataInfo();
    }
}, 30000);
