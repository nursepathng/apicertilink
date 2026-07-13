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
            getPublicProfileUrl: (username) => `https://certilink-itkd.onrender.com/${username}`
        };
        window.Utils = Utils;

        // ----------------------------------------------------------------
        //  API (inline)
        // ----------------------------------------------------------------
        const API = {
            baseURL: 'https://api-certilink.onrender.com/api',
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
//  PUBLIC PROFILE LOGIC - Handles ALL usernames
// ----------------------------------------------------------------

// Immediately extract username from URL
(function() {
    let username = null;
    
    // Get the current path
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(p => p);
    
    console.log('🔍 Path parts:', pathParts);
    console.log('📍 Current path:', path);
    
    // Check if we're on a /public/:username route
    if (pathParts.length >= 2 && pathParts[0] === 'public') {
        username = pathParts[1];
        console.log('✅ Found username in /public/:username:', username);
    }
    // Check if we're on a /:username route (without public prefix)
    // This handles /hey, /john, /alice, etc.
    else if (pathParts.length === 1) {
        const possibleUsername = pathParts[0];
        // Make sure it's not a file or special route
        if (!possibleUsername.includes('.') && 
            possibleUsername !== 'public-profile.html' && 
            possibleUsername !== '' &&
            possibleUsername !== 'index.html' &&
            possibleUsername !== 'dashboard.html' &&
            possibleUsername !== 'profile.html' &&
            possibleUsername !== 'favicon.ico') {
            username = possibleUsername;
            console.log('✅ Found username in /:username:', username);
        }
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
        } else if (pathParts.length === 1) {
            const possibleUsername = pathParts[0];
            if (!possibleUsername.includes('.') && 
                possibleUsername !== 'public-profile.html' && 
                possibleUsername !== '' &&
                possibleUsername !== 'index.html' &&
                possibleUsername !== 'dashboard.html' &&
                possibleUsername !== 'profile.html' &&
                possibleUsername !== 'favicon.ico') {
                username = possibleUsername;
            }
        }
    }

    if (!username || username === 'public-profile.html' || username === '') {
        console.error('❌ No username found');
        const nameElement = document.getElementById('publicName');
        const bioElement = document.getElementById('publicBio');
        if (nameElement) nameElement.textContent = 'User not found';
        if (bioElement) bioElement.textContent = 'No username provided';
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
        const nameElement = document.getElementById('publicName');
        const usernameDisplay = document.getElementById('publicUsernameDisplay');
        const bioElement = document.getElementById('publicBio');
        const avatarElement = document.getElementById('publicAvatar');
        
        if (nameElement) nameElement.textContent = data.user.name;
        if (usernameDisplay) usernameDisplay.textContent = `@${data.user.username}`;
        if (bioElement) bioElement.textContent = data.user.bio || 'No bio available';
        
        if (avatarElement && data.user.avatarUrl) {
            avatarElement.src = data.user.avatarUrl;
        }
        
        document.title = `${data.user.name} - Certil.ink`;

        // Handle certificates
        const grid = document.getElementById('publicCertificateGrid');
        const emptyState = document.getElementById('publicEmptyState');

        if (data.certificates && data.certificates.length > 0) {
            if (grid) {
                grid.innerHTML = data.certificates.map(cert => createPublicCertificateCard(cert)).join('');
                grid.style.display = 'grid';
            }
            if (emptyState) emptyState.style.display = 'none';
            console.log(`📄 Loaded ${data.certificates.length} certificates`);
        } else {
            if (grid) grid.style.display = 'none';
            if (emptyState) {
                emptyState.style.display = 'block';
                emptyState.innerHTML = `
                    <h3>No Certificates Yet</h3>
                    <p>This user hasn't uploaded any certificates.</p>
                `;
            }
            console.log('📄 No certificates found');
        }
    } catch (error) {
        console.error('❌ Error loading profile:', error);
        
        // Show friendly "user not found" message for ANY non-existent user
        const nameElement = document.getElementById('publicName');
        const usernameDisplay = document.getElementById('publicUsernameDisplay');
        const bioElement = document.getElementById('publicBio');
        const grid = document.getElementById('publicCertificateGrid');
        const emptyState = document.getElementById('publicEmptyState');
        
        if (nameElement) nameElement.textContent = 'User Not Found';
        if (usernameDisplay) usernameDisplay.textContent = `@${username}`;
        if (bioElement) bioElement.textContent = `The user "${username}" does not exist.`;
        
        if (grid) grid.style.display = 'none';
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <h3>Profile Not Found</h3>
                <p>The user you're looking for doesn't exist.</p>
                <a href="/" class="btn-primary" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 8px;">Go Home</a>
            `;
        }
        
        Utils.showAlert(`User "${username}" not found.`, 'error');
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

// Sticky header
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
