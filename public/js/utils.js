// Utility functions
const Utils = {
    // Show alert message
    showAlert: (message, type = 'success') => {
        const container = document.getElementById('alertContainer');
        if (!container) return;
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        container.appendChild(alert);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            alert.remove();
        }, 5000);
    },
    
    // Clear all alerts
    clearAlerts: () => {
        const container = document.getElementById('alertContainer');
        if (container) {
            container.innerHTML = '';
        }
    },
    
    // Get token from localStorage
    getToken: () => {
        return localStorage.getItem('token');
    },
    
    // Set token in localStorage
    setToken: (token) => {
        localStorage.setItem('token', token);
    },
    
    // Remove token from localStorage
    removeToken: () => {
        localStorage.removeItem('token');
    },
    
    // Get user from localStorage
    getUser: () => {
        try {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        } catch {
            return null;
        }
    },
    
    // Set user in localStorage
    setUser: (user) => {
        localStorage.setItem('user', JSON.stringify(user));
    },
    
    // Remove user from localStorage
    removeUser: () => {
        localStorage.removeItem('user');
    },
    
    // Check if user is authenticated
    isAuthenticated: () => {
        return !!Utils.getToken() && !!Utils.getUser();
    },
    
    // Format date
    formatDate: (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },
    
    // Get file icon based on type
    getFileIcon: (fileType) => {
        const icons = {
            'pdf': '📄',
            'jpg': '🖼️',
            'jpeg': '🖼️',
            'png': '🖼️'
        };
        return icons[fileType.toLowerCase()] || '📎';
    },
    
    // Get file type label
    getFileTypeLabel: (fileType) => {
        return fileType.toUpperCase();
    },
    
    // Copy to clipboard
    copyToClipboard: async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Fallback method
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        }
    },
    
    // Redirect to login if not authenticated
    requireAuth: () => {
        if (!Utils.isAuthenticated()) {
            window.location.href = '/';
            return false;
        }
        return true;
    },
    
    // Redirect to dashboard if authenticated
    redirectIfAuthenticated: () => {
        if (Utils.isAuthenticated()) {
            window.location.href = 'dashboard.html';
            return true;
        }
        return false;
    },
    
    // Get public profile URL
    getPublicProfileUrl: (username) => {
        return `https://certilink-itkd.onrender.com/${username}`;
    }
};

// Make Utils available globally
window.Utils = Utils;
