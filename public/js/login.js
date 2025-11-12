// ======================================================
// [LOGIN.JS] — Lógica da tela de login com UX aprimorada
// - Estados de loading e feedback visual
// - Validação básica de campos
// - Transições suaves
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
        // Botão Google com estado de loading
        this.googleBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleGoogleLogin();
        });

        // Formulário com validação
        this.formEmail?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEmailLogin(e);
        });

        // Feedback visual para interações
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

    async handleGoogleLogin() {
        // Simulação do fluxo OAuth com estados visuais
        try {
            this.setButtonLoading(this.googleBtn, true);
            
            // Simula delay de rede
            await this.delay(1500);
            
            // Feedback visual antes do alert
            this.showToast('Redirecionando para autenticação Google...', 'info');
            
            await this.delay(500);
            
            alert('🔐 OAuth Google virá na próxima etapa!\n\n' +
                  'No fluxo real:\n' +
                  '1. Redirecionamento para Google\n' +
                  '2. Autenticação na conta Google\n' +
                  '3. Retorno com tokens de acesso\n' +
                  '4. Criação de sessão no sistema');
                  
        } catch (error) {
            this.showToast('Erro na autenticação. Tente novamente.', 'error');
        } finally {
            this.setButtonLoading(this.googleBtn, false);
        }
    }

    async handleEmailLogin(event) {
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        
        // Valida todos os campos
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
            
            // Simula processamento
            await this.delay(1200);
            
            // Feedback visual melhorado
            this.showLoginSuccess(data);
            
        } catch (error) {
            this.showToast('Erro no login. Tente novamente.', 'error');
        } finally {
            this.setButtonLoading(this.submitBtn, false);
        }
    }

    showLoginSuccess(data) {
        // Cria modal de sucesso mais elaborado
        const modal = document.createElement('div');
        modal.className = 'login-feedback';
        modal.innerHTML = `
            <div class="login-feedback__content">
                <div class="login-feedback__icon">✓</div>
                <h3>Login Simulado com Sucesso!</h3>
                <div class="login-feedback__data">
                    <p><strong>Nome:</strong> ${data.nome}</p>
                    <p><strong>E-mail:</strong> ${data.email}</p>
                </div>
                <div class="login-feedback__note">
                    ⚠️ Na próxima etapa isso será substituído por:<br>
                    • Validação real na API<br>
                    • Criação de sessão<br>
                    • Redirecionamento automático
                </div>
                <button class="btn btn--primary" onclick="this.closest('.login-feedback').remove()">
                    Continuar
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Adiciona estilos inline para o feedback
        if (!document.querySelector('#login-feedback-styles')) {
            const styles = document.createElement('style');
            styles.id = 'login-feedback-styles';
            styles.textContent = `
                .login-feedback {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    animation: fadeIn 0.3s ease;
                }
                
                .login-feedback__content {
                    background: white;
                    padding: 2rem;
                    border-radius: 12px;
                    text-align: center;
                    max-width: 400px;
                    margin: 1rem;
                    animation: slideUp 0.3s ease;
                }
                
                .login-feedback__icon {
                    font-size: 3rem;
                    color: #1f8a5b;
                    margin-bottom: 1rem;
                }
                
                .login-feedback__data {
                    text-align: left;
                    background: #f8f9fa;
                    padding: 1rem;
                    border-radius: 8px;
                    margin: 1rem 0;
                }
                
                .login-feedback__note {
                    font-size: 0.85rem;
                    color: #666;
                    margin: 1rem 0;
                    line-height: 1.4;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(styles);
        }
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
        // Remove toast anterior se existir
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.textContent = message;
        
        // Adiciona estilos para o toast
        if (!document.querySelector('#toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'toast-styles';
            styles.textContent = `
                .toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 12px 20px;
                    border-radius: 8px;
                    color: white;
                    font-weight: 500;
                    z-index: 1001;
                    animation: slideInRight 0.3s ease, slideOutRight 0.3s ease 2.7s forwards;
                    max-width: 300px;
                }
                
                .toast--info { background: #1f8a5b; }
                .toast--error { background: #dc2626; }
                .toast--success { background: #16a34a; }
                
                @keyframes slideInRight {
                    from { 
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to { 
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOutRight {
                    from { 
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to { 
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(toast);
        
        // Remove automaticamente após 3 segundos
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});

// Fallback para o código original (mantém compatibilidade)
document.getElementById('btnGoogle')?.addEventListener('click', (e) => {
    e.preventDefault();
});

document.getElementById('formEmail')?.addEventListener('submit', (e) => {
    e.preventDefault();
});