// API Configuration
const API = {
    baseURL: 'http://localhost:5000/api',
    
    // Get headers with auth token
    getHeaders: (includeAuth = true) => {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (includeAuth) {
            const token = Utils.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        
        return headers;
    },
    
    // Generic request function
    request: async (endpoint, options = {}) => {
        const url = `${API.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...API.getHeaders(options.includeAuth !== false),
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    // Auth endpoints
    auth: {
        register: (userData) => {
            return API.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData),
                includeAuth: false
            });
        },
        
        login: (credentials) => {
            return API.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials),
                includeAuth: false
            });
        },
        
        logout: () => {
            return API.request('/auth/logout', {
                method: 'POST'
            });
        }
    },
    
    // Profile endpoints
    profile: {
        get: () => {
            return API.request('/profile/me');
        },
        
        update: (data) => {
            return API.request('/profile', {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },
        
        uploadAvatar: async (file) => {
            const formData = new FormData();
            formData.append('avatar', file);
            
            const token = Utils.getToken();
            const response = await fetch(`${API.baseURL}/profile/avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Avatar upload failed');
            }
            return data;
        }
    },
    
    // Certificate endpoints
    certificates: {
        upload: async (title, file, onProgress) => {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('file', file);
            
            const token = Utils.getToken();
            
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable && onProgress) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        onProgress(percentComplete);
                    }
                });
                
                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            resolve(response);
                        } catch (e) {
                            reject(new Error('Invalid response from server'));
                        }
                    } else {
                        try {
                            const error = JSON.parse(xhr.responseText);
                            reject(new Error(error.message || 'Upload failed'));
                        } catch (e) {
                            reject(new Error('Upload failed'));
                        }
                    }
                });
                
                xhr.addEventListener('error', () => {
                    reject(new Error('Network error occurred'));
                });
                
                xhr.open('POST', `${API.baseURL}/certificates`);
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.send(formData);
            });
        },
        
        getAll: () => {
            return API.request('/certificates');
        },
        
        delete: (id) => {
            return API.request(`/certificates/${id}`, {
                method: 'DELETE'
            });
        }
    },
    
    // Public endpoints
    public: {
        getProfile: (username) => {
            return API.request(`/u/${username}`, {
                includeAuth: false
            });
        }
    }
};

// Make API available globally
window.API = API;