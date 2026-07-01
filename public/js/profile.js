// ----------------------------------------------------------------
        //  UTILITY & API (inline, as requested)
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
            getPublicProfileUrl: (username) => `https://api-certilink.onrender.com/${username}`
        };
        window.Utils = Utils;

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
            profile: {
                get: () => API.request('/profile/me'),
                update: (data) => API.request('/profile', { method: 'PUT', body: JSON.stringify(data) }),
                uploadAvatar: async (file) => {
                    const formData = new FormData();
                    formData.append('avatar', file);
                    const token = Utils.getToken();
                    const res = await fetch(`${API.baseURL}/profile/avatar`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formData
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || 'Avatar upload failed');
                    return data;
                }
            },
            certificates: {
                getAll: () => API.request('/certificates')
            },
            auth: {
                logout: () => API.request('/auth/logout', { method: 'POST' })
            }
        };
        window.API = API;

        // ----------------------------------------------------------------
        //  PROFILE PAGE LOGIC
        // ----------------------------------------------------------------
        document.addEventListener('DOMContentLoaded', async () => {
            // Check auth
            if (!Utils.requireAuth()) return;

            // Load profile
            await loadProfile();

            // Logout
            document.getElementById('logoutBtn').addEventListener('click', handleLogout);

            // Avatar upload
            document.getElementById('changeAvatarBtn').addEventListener('click', () => {
                document.getElementById('avatarInput').click();
            });
            document.getElementById('avatarInput').addEventListener('change', handleAvatarUpload);

            // Profile form submit (already handled inline with onsubmit)
            // Copy link
            document.getElementById('copyLinkBtn').addEventListener('click', handleCopyLink);

            // Bio char count
            const bioTextarea = document.getElementById('editBio');
            const charCount = document.getElementById('char-count');
            bioTextarea.addEventListener('input', () => {
                const count = bioTextarea.value.length;
                charCount.innerText = `${count} / 300`;
                if (count > 300) charCount.classList.add('text-error');
                else charCount.classList.remove('text-error');
            });
        });

        async function loadProfile() {
            try {
                const data = await API.profile.get();
                const user = data.user;
                document.getElementById('profileName').textContent = user.name;
                document.getElementById('profileUsername').textContent = user.username;
                document.getElementById('profileBio').textContent = user.bio || 'No bio yet';
                document.getElementById('publicProfileDisplay').textContent = `certil.ink/public/${user.username}`;
                document.getElementById('editName').value = user.name;
                document.getElementById('editBio').value = user.bio || '';
                if (user.avatarUrl) {
                    document.getElementById('profileAvatar').src = user.avatarUrl;
                    document.getElementById('navAvatar').src = user.avatarUrl;
                }
                // update char count
                const bio = document.getElementById('editBio');
                const count = bio.value.length;
                document.getElementById('char-count').innerText = `${count} / 300`;

                // load cert count
                try {
                    const certData = await API.certificates.getAll();
                    const cnt = certData.certificates ? certData.certificates.length : 0;
                    document.getElementById('certificateCount').textContent = `${cnt} Certificates Earned`;
                } catch (e) { console.warn('cert count fail', e); }
            } catch (error) {
                Utils.showAlert('Failed to load profile: ' + error.message, 'error');
            }
        }

        async function handleAvatarUpload(e) {
            const file = e.target.files[0];
            if (!file) return;
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!validTypes.includes(file.type)) {
                Utils.showAlert('Invalid file type. Only JPG, JPEG, PNG allowed.', 'error');
                e.target.value = '';
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                Utils.showAlert('File size must be less than 2MB', 'error');
                e.target.value = '';
                return;
            }
            try {
                const response = await API.profile.uploadAvatar(file);
                document.getElementById('profileAvatar').src = response.avatarUrl;
                document.getElementById('navAvatar').src = response.avatarUrl;
                Utils.showAlert('Avatar updated successfully!', 'success');
            } catch (error) {
                Utils.showAlert('Failed to upload avatar: ' + error.message, 'error');
            }
            e.target.value = '';
        }

        async function handleProfileUpdate(e) {
            e.preventDefault();
            const name = document.getElementById('editName').value.trim();
            const bio = document.getElementById('editBio').value.trim();
            if (!name) {
                Utils.showAlert('Name is required', 'error');
                return;
            }
            try {
                const data = await API.profile.update({ name, bio });
                document.getElementById('profileName').textContent = data.user.name;
                document.getElementById('profileBio').textContent = data.user.bio || 'No bio yet';
                // update localstorage
                const user = Utils.getUser();
                if (user) { user.name = data.user.name;
                    user.bio = data.user.bio;
                    Utils.setUser(user); }
                Utils.showAlert('Profile updated successfully!', 'success');
                // also update char count
                const count = document.getElementById('editBio').value.length;
                document.getElementById('char-count').innerText = `${count} / 300`;
                // Show toast
                showToast('Profile successfully updated');
            } catch (error) {
                Utils.showAlert('Failed to update profile: ' + error.message, 'error');
            }
        }

        async function handleCopyLink() {
            const username = document.getElementById('profileUsername').textContent;
            const url = Utils.getPublicProfileUrl(username);
            const ok = await Utils.copyToClipboard(url);
            if (ok) {
                Utils.showAlert('Profile link copied to clipboard!', 'success');
                showToast('Link copied to clipboard');
            } else {
                Utils.showAlert('Failed to copy link', 'error');
            }
        }

        async function handleLogout(e) {
            e.preventDefault();
            try { await API.auth.logout(); } catch (error) { console.error('Logout error:', error); }
            Utils.removeToken();
            Utils.removeUser();
            window.location.href = 'index.html';
        }

        function showToast(message) {
            const toast = document.getElementById('toast');
            const msg = document.getElementById('toastMessage');
            msg.innerText = message;
            toast.classList.remove('hidden-toast');
            toast.classList.add('visible-toast');
            setTimeout(() => {
                toast.classList.remove('visible-toast');
                toast.classList.add('hidden-toast');
            }, 3000);
        }
