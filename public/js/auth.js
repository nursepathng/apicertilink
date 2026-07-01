// Auth page functionality
document.addEventListener('DOMContentLoaded', () => {
    // Check if already authenticated
    if (Utils.isAuthenticated()) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Tab switching
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    loginTab.addEventListener('click', (e) => {
        e.preventDefault();
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        Utils.clearAlerts();
    });
    
    registerTab.addEventListener('click', (e) => {
        e.preventDefault();
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        Utils.clearAlerts();
    });
    
    // Login form submission
    document.getElementById('loginFormElement').addEventListener('submit', async (e) => {
        e.preventDefault();
        Utils.clearAlerts();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            Utils.showAlert('Please fill in all fields', 'error');
            return;
        }
        
        try {
            const response = await API.auth.login({ email, password });
            
            // Save token and user data
            Utils.setToken(response.token);
            Utils.setUser(response.user);
            
            Utils.showAlert('Login successful! Redirecting...', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } catch (error) {
            Utils.showAlert(error.message || 'Login failed. Please try again.', 'error');
        }
    });
    
    // Register form submission
    document.getElementById('registerFormElement').addEventListener('submit', async (e) => {
        e.preventDefault();
        Utils.clearAlerts();
        
        const name = document.getElementById('registerName').value;
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        if (!name || !username || !email || !password) {
            Utils.showAlert('Please fill in all fields', 'error');
            return;
        }
        
        if (password.length < 6) {
            Utils.showAlert('Password must be at least 6 characters', 'error');
            return;
        }
        
        try {
            const response = await API.auth.register({ name, username, email, password });
            
            // Save token and user data
            Utils.setToken(response.token);
            Utils.setUser(response.user);
            
            Utils.showAlert('Account created successfully! Redirecting...', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } catch (error) {
            Utils.showAlert(error.message || 'Registration failed. Please try again.', 'error');
        }
    });
});