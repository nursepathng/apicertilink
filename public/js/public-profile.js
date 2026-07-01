// ----------------------------------------------------------------
        //  UTILITY (inline)
        // ----------------------------------------------------------------
        const Utils = {
            showAlert: (message, type = 'success') => {
                const container = document.getElementById('alertContainer');
                if (!container) return;
                const alert = document.createElement('div');
                alert.className = `alert alert-${type}`;
                alert.textContent = message;
                container.appendChild(alert);
                setTimeout(() => { alert.remove(); }, 5000);
            },
            clearAlerts: () => {
                const container = document.getElementById('alertContainer');
                if (container) container.innerHTML = '';
            },
            getToken: () => localStorage.getItem('token'),
            setToken: (token) => localStorage.setItem('token', token),
            removeToken: () => localStorage.removeItem('token'),
            getUser: () => {
                try { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; } catch { return null; }
            },
            setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),
            removeUser: () => localStorage.removeItem('user'),
            isAuthenticated: () => !!Utils.getToken() && !!Utils.getUser(),
            formatDate: (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short',
                    day: 'numeric' }),
            getFileIcon: (fileType) => { const icons = { 'pdf': '📄', 'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️' }; return icons[
                    fileType.toLowerCase()] || '📎'; },
            getFileTypeLabel: (fileType) => fileType.toUpperCase(),
            copyToClipboard: async (text) => {
                try { await navigator.clipboard.writeText(text); return true; } catch {
                    const ta = document.createElement('textarea');
                    ta.value = text;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                    return true;
                }
            },
            requireAuth: () => { if (!Utils.isAuthenticated()) { window.location.href = '/'; return false; } return true; },
            getPublicProfileUrl: (username) => `http://localhost/certilink/public/${username}`
        };
        window.Utils = Utils;

        // ----------------------------------------------------------------
        //  API (inline)
        // ----------------------------------------------------------------
        const API = {
            baseURL: 'http://localhost:5000/api',
            getHeaders: (includeAuth = true) => {
                const headers = { 'Content-Type': 'application/json' };
                if (includeAuth) {
                    const token = Utils.getToken();
                    if (token) headers['Authorization'] = `Bearer ${token}`;
                }
                return headers;
            },
            request: async (endpoint, options = {}) => {
                const url = `${API.baseURL}${endpoint}`;
                const config = { ...options, headers: { ...API.getHeaders(options.includeAuth !== false), ...options
                            .headers } };
                const response = await fetch(url, config);
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Request failed');
                return data;
            },
            public: {
                getProfile: (username) => API.request(`/u/${username}`, { includeAuth: false })
            }
        };
        window.API = API;

// public/js/public-profile.js

// ----------------------------------------------------------------
//  PUBLIC PROFILE LOGIC
// ----------------------------------------------------------------

// Immediately extract username from URL
(function() {
    let username = null;
    
    // Method 1: Get from URL path /public/username
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(p => p);
    
    console.log('🔍 Path parts:', pathParts);
    
    // Check if we're on a /public/:username route
    if (pathParts.length >= 2 && pathParts[0] === 'public') {
        username = pathParts[1];
        console.log('✅ Found username in /public/:username:', username);
    }
    // Check if we're on a /:username route (without public prefix)
    else if (pathParts.length === 1 && 
             pathParts[0] !== 'public-profile.html' && 
             pathParts[0] !== '' &&
             !pathParts[0].includes('.')) {
        username = pathParts[0];
        console.log('✅ Found username in /:username:', username);
    }
    
    // Method 2: Get from query parameter (backward compatibility)
    if (!username) {
        const urlParams = new URLSearchParams(window.location.search);
        username = urlParams.get('username');
        if (username) {
            console.log('✅ Found username from query param:', username);
        }
    }
    
    // Store the username globally
    if (username) {
        window._publicUsername = username;
        console.log('🔍 Username set:', username);
    } else {
        console.log('❌ No username detected in URL');
    }
})();

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 Public Profile page loaded');
    console.log('📍 Current URL:', window.location.href);
    
    let username = window._publicUsername;
    
    // If still no username, try one more time from path
    if (!username) {
        const path = window.location.pathname;
        const pathParts = path.split('/').filter(p => p);
        if (pathParts.length >= 2 && pathParts[0] === 'public') {
            username = pathParts[1];
        } else if (pathParts.length === 1 && pathParts[0] !== 'public-profile.html' && !pathParts[0].includes('.')) {
            username = pathParts[0];
        }
    }

    if (!username || username === 'public-profile.html' || username === '') {
        console.error('❌ No username found');
        document.getElementById('publicName').textContent = 'User not found';
        document.getElementById('publicBio').textContent = 'No username provided';
        Utils.showAlert('No username provided. Please check the URL.', 'error');
        return;
    }
    
    console.log('🚀 Loading profile for username:', username);
    await loadPublicProfile(username);
});

async function loadPublicProfile(username) {
    try {
        console.log('📡 Fetching profile data for:', username);
        const data = await API.public.getProfile(username);
        console.log('✅ Profile data received:', data);
        
        // Update profile information
        document.getElementById('publicName').textContent = data.user.name;
        document.getElementById('publicUsernameDisplay').textContent = `@${data.user.username}`;
        document.getElementById('publicBio').textContent = data.user.bio || 'No bio available';
        
        if (data.user.avatarUrl) {
            document.getElementById('publicAvatar').src = data.user.avatarUrl;
        }
        
        document.title = `${data.user.name} - Certil.ink`;

        // Handle certificates
        const grid = document.getElementById('publicCertificateGrid');
        const emptyState = document.getElementById('publicEmptyState');

        if (data.certificates && data.certificates.length > 0) {
            grid.innerHTML = data.certificates.map(cert => createPublicCertificateCard(cert)).join('');
            grid.style.display = 'grid';
            emptyState.style.display = 'none';
            console.log(`📄 Loaded ${data.certificates.length} certificates`);
        } else {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            console.log('📄 No certificates found');
        }
    } catch (error) {
        console.error('❌ Error loading profile:', error);
        document.getElementById('publicName').textContent = 'User not found';
        document.getElementById('publicBio').textContent = 'This user does not exist';
        Utils.showAlert('User not found. Please check the username.', 'error');
    }
}

function createPublicCertificateCard(cert) {
    const icon = Utils.getFileIcon(cert.fileType);
    const typeLabel = Utils.getFileTypeLabel(cert.fileType);
    const date = Utils.formatDate(cert.uploadedAt);

    let previewContent = '';
    if (cert.fileType === 'pdf') {
        previewContent = `
            <iframe src="${cert.fileUrl}" class="cert-preview-pdf" frameborder="0"></iframe>
        `;
    } else {
        previewContent = `
            <img src="${cert.fileUrl}" alt="${cert.title}" class="cert-preview-image" 
                 onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'cert-preview-error\\'>🖼️<br><small>Preview not available</small></div>'">
        `;
    }

    return `
        <div class="certificate-card">
            <div class="cert-preview-container">
                ${previewContent}
            </div>
            <div class="cert-details">
                <div class="cert-title">${cert.title}</div>
                <div class="cert-type">${typeLabel}</div>
                <div class="cert-date">Uploaded: ${date}</div>
                <div class="cert-actions">
                    <a href="${cert.fileUrl}" target="_blank" class="btn-secondary btn-block">View Certificate</a>
                </div>
            </div>
        </div>
    `;
}

// ----------------------------------------------------------------
//  VERIFIED ICON HANDLER
// ----------------------------------------------------------------

function handleVerifiedClick() {
    const verifiedIcon = document.querySelector('#verifiedIcon');
    if (!verifiedIcon) {
        console.log('⚠️ Verified icon not found');
        return;
    }

    verifiedIcon.addEventListener('click', async function(e) {
        e.stopPropagation();
        
        const usernameElement = document.getElementById('publicUsernameDisplay');
        const username = usernameElement ? usernameElement.textContent.replace('@', '') : 'Unknown User';
        const nameElement = document.getElementById('publicName');
        const fullName = nameElement ? nameElement.textContent : 'User';
        
        const modal = document.createElement('div');
        modal.className = 'verified-modal';
        modal.innerHTML = `
            <div class="verified-modal-content">
                <div class="verified-header">
                    <span class="material-symbols-outlined verified-icon" style="font-variation-settings: 'FILL' 1; color: #004ac6; font-size: 48px;">verified</span>
                    <h2>Verified Profile</h2>
                </div>
                <div class="verified-body">
                    <p><strong>Username:</strong> @${username}</p>
                    <p><strong>Name:</strong> ${fullName}</p>
                    <div class="verified-badge">
                        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1; color: #004ac6; font-size: 20px;">verified</span>
                        This profile is verified
                    </div>
                </div>
                <div class="verified-footer">
                    <button class="btn-primary learn-more-btn">Learn More</button>
                    <button class="material-symbols-outlined btn-secondary close-modal-btn">close</button>
                </div>
            </div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .verified-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }
            
            .verified-modal-content {
                background: white;
                border-radius: 16px;
                padding: 32px;
                max-width: 420px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease;
                position: relative;
            }
            
            .verified-header {
                text-align: center;
                margin-bottom: 24px;
            }
            
            .verified-header .verified-icon {
                display: block;
                margin: 0 auto 12px;
            }
            
            .verified-header h2 {
                color: #333;
                font-size: 24px;
                margin: 0;
            }
            
            .verified-body {
                margin-bottom: 24px;
                padding: 16px;
                background: #f8f9fa;
                border-radius: 8px;
            }
            
            .verified-body p {
                margin: 8px 0;
                color: #555;
                font-size: 14px;
            }
            
            .verified-badge {
                display: flex;
                align-items: center;
                gap: 8px;
                background: #e8f5e9;
                padding: 8px 12px;
                border-radius: 20px;
                margin-top: 12px;
                color: #004ac6;
                font-size: 14px;
                font-weight: 500;
            }
            
            .verified-footer {
                display: flex;
                gap: 12px;
                justify-content: center;
            }
            
            .verified-footer button {
                padding: 10px 24px;
                border-radius: 8px;
                border: none;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .learn-more-btn {
                background: #007bff;
                color: white;
                flex: 1;
            }
            
            .learn-more-btn:hover {
                background: #0056b3;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
            }
            
            .close-modal-btn {
                background: #f1f3f5;
                color: #333;
            }
            
            .close-modal-btn:hover {
                background: #e0e4e8;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(modal);
        
        modal.querySelector('.close-modal-btn').addEventListener('click', () => {
            modal.remove();
            style.remove();
        });
        
        modal.querySelector('.learn-more-btn').addEventListener('click', () => {
            window.location.href = 'learnmore.html';
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                style.remove();
            }
        });
        
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                modal.remove();
                style.remove();
                document.removeEventListener('keydown', escHandler);
            }
        });
    });
}

// Initialize the handler when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    handleVerifiedClick();
});

// sticky header
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (header) {
        if (window.scrollY > 20) {
            header.classList.add('glass-header');
        } else {
            header.classList.remove('glass-header');
        }
    }
});