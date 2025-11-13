// ======================================================
// [LOGIN.JS] — Tela de login com UX aprimorada
// AGORA COM LOGIN REAL via API (NADA DE SIMULAÇÃO)
// ======================================================

class LoginManager {
    constructor() {
        this.init();
    }

    init() {
        this.googleBtn = document.getElementById('btnGoogle');
        this.formEmail = document.getElementById('formEmail');
        this.submitBtn = this.formEmail?.querySelector('button[type="submit"]');

        this.setupEventListeners();
        this.setupFormValidation();
    }

    setupEventListeners() {
        // Botão Google (mantém placeholder para etapa OAuth)
        this.googleBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleGoogleLogin();
        });

        // Formulário com validação
        this.formEmail?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEmailLogin(e);
        });

        this.setupInputInteractions();
    }

    setupFormValidation() {
        const inputs = this.formEmail?.querySelectorAll('input[required]');
        inputs?.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    setupInputInteractions() {
        const inputs = this.formEmail?.querySelectorAll('input');
        inputs?.forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('field--focused');
            });
            input.addEventListener('blur', () => {
                input.parentElement.classList.remove('field--focused');
            });
        });
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let message = '';

        switch(field.type) {
            case 'email':
                if (!value) {
                    isValid = false;
                    message = 'E-mail é obrigatório';
                } else if (!this.isValidEmail(value)) {
                    isValid = false;
                    message = 'Por favor, insira um e-mail válido';
                }
                break;

            case 'text':
                if (!value) {
                    isValid = false;
                    message = 'Nome é obrigatório';
                } else if (value.length < 2) {
                    isValid = false;
                    message = 'Nome deve ter pelo menos 2 caracteres';
                }
                break;
        }

        this.showFieldStatus(field, isValid, message);
        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    clearFieldError(field) {
        field.classList.remove('input--error', 'input--success');
        const feedback = field.parentElement.querySelector('.field__feedback');
        if (feedback) {
            feedback.textContent = '';
            feedback.className = 'field__feedback';
        }
    }

    showFieldStatus(field, isValid, message = '') {
        field.classList.remove('input--error', 'input--success');
        const feedback = field.parentElement.querySelector('.field__feedback');

        if (!feedback) return;

        if (isValid) {
            field.classList.add('input--success');
            feedback.textContent = '✓ Correto';
            feedback.className = 'field__feedback field__feedback--success';
        } else {
            field.classList.add('input--error');
            feedback.textContent = message;
            feedback.className = 'field__feedback field__feedback--error';
        }
    }

    // ---------------------------------------------------------------
    // 🔥 LOGIN REAL (NÃO É MAIS SIMULADO)
    // ---------------------------------------------------------------
    async handleEmailLogin(event) {
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());

        // Validação geral
        const inputs = event.target.querySelectorAll('input[required]');
        let allValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                allValid = false;
            }
        });

        if (!allValid) {
            this.showToast('Por favor, corrija os campos destacados', 'error');
            return;
        }

        try {
            this.setButtonLoading(this.submitBtn, true);

            // 🔥 ENVIA LOGIN REAL PARA O BACK-END
            const r = await fetch('api.php?action=login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: data.nome,
                    email: data.email
                })
            });

            const j = await r.json();

            if (!j.ok) {
                this.showToast(j.error || 'Erro no login', 'error');
                return;
            }

            // 🔥 LOGIN OK → redireciona pro index
            this.showToast('Login realizado! Redirecionando...', 'success');
            await this.delay(600);
            window.location.href = 'index.html';

        } catch (error) {
            console.error(error);
            this.showToast('Erro ao conectar com o servidor.', 'error');
        } finally {
            this.setButtonLoading(this.submitBtn, false);
        }
    }

    // ---------------------------------------------------------------
    // Mantém placeholder do Google OAuth
    // ---------------------------------------------------------------
    async handleGoogleLogin() {
        this.showToast('Login Google será ativado em breve!', 'info');
    }

    setButtonLoading(button, isLoading) {
        if (!button) return;

        if (isLoading) {
            button.classList.add('btn--loading');
            button.disabled = true;
            button.setAttribute('aria-label', 'Carregando...');
        } else {
            button.classList.remove('btn--loading');
            button.disabled = false;
            button.removeAttribute('aria-label');
        }
    }

    showToast(message, type = 'info') {
        const existingToast = document.querySelector('.toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 3000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});
