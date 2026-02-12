const API_URL = '/api/auth';

const Auth = {
    isAuthenticated: () => {
        const token = localStorage.getItem('token');
        // Basic check, in a real app you might validate expiry
        return !!token;
    },

    getToken: () => {
        return localStorage.getItem('token');
    },

    saveToken: (token, username) => {
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/login.html';
    },

    redirectIfAuthenticated: () => {
        if (Auth.isAuthenticated()) {
            window.location.href = '/home.html';
        }
    },

    checkAuth: () => {
        if (!Auth.isAuthenticated()) {
            window.location.href = '/login.html';
        }
    }
};

// Theme Toggler
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateToggleIcon(toggleBtn, newTheme);
        });
        updateToggleIcon(toggleBtn, savedTheme);
    }
}

function updateToggleIcon(btn, theme) {
    // Simple ASCII icons or SVG replacement
    btn.innerHTML = theme === 'dark' ? 
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>' : 
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
}

document.addEventListener('DOMContentLoaded', initTheme);
