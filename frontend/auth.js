const API_URL = 'https://feedback-api-gj5t.onrender.com';

const Auth = {
    isAuthenticated: () => {
        const token = localStorage.getItem('token');
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
    },

    fetch: async (url, options = {}) => {
        const token = Auth.getToken();
        
        options.headers = options.headers || {};
        
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        
        try {
            const response = await fetch(url, options);
            
            if (response.status === 401 || response.status === 403) {
                console.warn('Sessão expirada. Redirecionando...');
                Auth.logout();
                throw new Error('Sessão expirada');
            }
            
            return response;
        } catch (error) {
            throw error;
        }
    }
};



window.togglePassword = function(inputId, btn) {
    const input = document.getElementById(inputId);
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    

    if (type === 'text') {

        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
    } else {

        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    }
};

;


window.validateField = function(input) {
    const parent = input.closest('.form-group');
    const wrapper = input.closest('.input-with-icon');
    let errorMsg = parent.querySelector('.field-error-msg');
    

    if (!errorMsg) {
        errorMsg = document.createElement('span');
        errorMsg.className = 'field-error-msg';
        parent.appendChild(errorMsg);
    }
    
    const value = input.value.trim();
    let isValid = true;
    let message = '';


    if (input.dataset.serverError) {
        isValid = false;
        message = input.dataset.serverErrorMessage || 'Inválido';

        if(errorMsg.textContent !== message) errorMsg.textContent = message;
    }

    else if (input.hasAttribute('required') && !value) {
        isValid = false;
        message = 'Campo obrigatório';
    } 

    else if (input.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            message = 'Email inválido';
        }
    }

    else if (input.id === 'password' && value && value.length < 8 && document.body.contains(document.getElementById('registerForm'))) {
         isValid = false;
         message = 'Mínimo 8 caracteres';
    }


    if (!isValid) {
        input.classList.add('error');
        input.classList.remove('success');
        errorMsg.textContent = message;
    } else {
        input.classList.remove('error');
        input.classList.add('success');
        errorMsg.textContent = '';
    }
    
    return isValid;
};


document.addEventListener('DOMContentLoaded', () => {

    


    const inputs = document.querySelectorAll('.form-input[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {

            if (input.dataset.serverError) {
                delete input.dataset.serverError;
                delete input.dataset.serverErrorMessage;
            }


            if(input.classList.contains('error')) {
                input.classList.remove('error');
                const parent = input.closest('.form-group');
                const errorMsg = parent.querySelector('.field-error-msg');
                if(errorMsg) errorMsg.textContent = '';
            }
        });
    });
});
