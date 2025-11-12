// ======================================================
// [INDEX.JS] — Interações e melhorias de UX para a Home
// Foco: Animações, feedback visual e microinterações
// ======================================================

class HomeInteractions {
    constructor() {
        this.init();
    }

    init() {
        this.setupScrollAnimations();
        this.setupCardInteractions();
        this.setupButtonMicrointeractions();
        this.setupHeroAnimation();
        this.setupLoadingStates();
        this.setupObserverAnimations();
    }

    // 1. Animações de scroll suave para links internos
    setupScrollAnimations() {
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                
                if (href !== '#') {
                    const target = document.querySelector(href);
                    if (target) {
                        e.preventDefault();
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        });
    }

    // 2. Interações com cards de destaque
    setupCardInteractions() {
        const cards = document.querySelectorAll('.card, .feature');
        
        cards.forEach(card => {
            // Efeito de levantamento suave
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px)';
                card.style.boxShadow = '0 20px 40px rgba(2, 6, 23, 0.12)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = 'var(--shadow)';
            });

            // Feedback de clique
            card.addEventListener('click', (e) => {
                if (e.target.tagName !== 'A') {
                    const button = card.querySelector('.btn');
                    if (button) {
                        this.createRippleEffect(e, button);
                    }
                }
            });
        });
    }

    // 3. Microinterações em botões
    setupButtonMicrointeractions() {
        const buttons = document.querySelectorAll('.btn');
        
        buttons.forEach(button => {
            // Efeito ripple
            button.addEventListener('click', (e) => {
                this.createRippleEffect(e, button);
            });

            // Loading state para botões de ação
            if (button.classList.contains('btn--primary')) {
                button.addEventListener('click', () => {
                    this.simulateLoading(button, 1200);
                });
            }
        });
    }

    // 4. Animação do hero section
    setupHeroAnimation() {
        const hero = document.querySelector('.hero');
        const heroCard = document.querySelector('.hero__card');
        
        if (hero && heroCard) {
            // Animação de entrada do card
            setTimeout(() => {
                heroCard.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                heroCard.style.opacity = '1';
                heroCard.style.transform = 'translateY(0) rotate(-1.2deg)';
            }, 300);

            // Efeito parallax sutil no scroll
            window.addEventListener('scroll', () => {
                const scrolled = window.pageYOffset;
                const rate = scrolled * -0.5;
                hero.style.transform = `translateY(${rate}px)`;
            });
        }
    }

    // 5. Estados de loading para ações
    setupLoadingStates() {
        // Simular loading para links que levam a outras páginas
        document.querySelectorAll('a[href*="cardapio"]').forEach(link => {
            link.addEventListener('click', (e) => {
                if (!link.classList.contains('btn--loading')) {
                    this.simulateNavigationLoading(e, link);
                }
            });
        });
    }

    // 6. Animações on-scroll com Intersection Observer
    setupObserverAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    
                    // Animação em cascata para grids
                    if (entry.target.classList.contains('grid-3')) {
                        const items = entry.target.querySelectorAll('.card, .feature');
                        items.forEach((item, index) => {
                            item.style.transitionDelay = `${index * 0.1}s`;
                            item.style.opacity = '1';
                            item.style.transform = 'translateY(0)';
                        });
                    }
                }
            });
        }, observerOptions);

        // Observar elementos para animar
        const elementsToAnimate = document.querySelectorAll(
            '.features, .callout, .grid-3, .trust'
        );
        
        elementsToAnimate.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    // ======================================================
    // MÉTODOS AUXILIARES
    // ======================================================

    // Efeito ripple para cliques
    createRippleEffect(event, element) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.classList.add('ripple');

        // Remove ripple existente
        const existingRipple = element.querySelector('.ripple');
        if (existingRipple) {
            existingRipple.remove();
        }

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        // Adiciona estilos do ripple se não existirem
        if (!document.querySelector('#ripple-styles')) {
            const styles = document.createElement('style');
            styles.id = 'ripple-styles';
            styles.textContent = `
                .ripple {
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.6);
                    transform: scale(0);
                    animation: ripple-animation 0.6s linear;
                    pointer-events: none;
                }
                
                @keyframes ripple-animation {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        setTimeout(() => ripple.remove(), 600);
    }

    // Simular estado de loading
    simulateLoading(button, duration) {
        const originalText = button.innerHTML;
        
        button.classList.add('btn--loading');
        button.innerHTML = `
            <span class="btn__spinner"></span>
            Carregando...
        `;
        button.disabled = true;

        setTimeout(() => {
            button.classList.remove('btn--loading');
            button.innerHTML = originalText;
            button.disabled = false;
        }, duration);
    }

    // Simular navegação com feedback
    simulateNavigationLoading(event, link) {
        event.preventDefault();
        
        link.classList.add('btn--loading');
        const originalText = link.innerHTML;
        
        link.innerHTML = `
            <span class="btn__spinner"></span>
            Redirecionando...
        `;

        // Simula o tempo de carregamento da página
        setTimeout(() => {
            window.location.href = link.href;
        }, 800);
    }

    // Preload de imagens para melhor performance
    preloadImages() {
        const images = [];
        document.querySelectorAll('img').forEach(img => {
            const src = img.getAttribute('src');
            if (src) images.push(src);
        });

        images.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }
}

// ======================================================
// INICIALIZAÇÃO E FUNÇÕES GLOBAIS
// ======================================================

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar interações
    new HomeInteractions();

    // Header sticky com background ao scrollar
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
                header.style.backdropFilter = 'blur(10px)';
                header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            } else {
                header.style.background = '';
                header.style.backdropFilter = '';
                header.style.boxShadow = '';
            }
        });
    }

    // Adicionar estilos para estados de loading
    if (!document.querySelector('#btn-loading-styles')) {
        const styles = document.createElement('style');
        styles.id = 'btn-loading-styles';
        styles.textContent = `
            .btn--loading {
                position: relative;
                pointer-events: none;
                opacity: 0.8;
            }
            
            .btn__spinner {
                width: 16px;
                height: 16px;
                border: 2px solid transparent;
                border-top: 2px solid currentColor;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                display: inline-block;
                margin-right: 8px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(styles);
    }
});

// Função utilitária para debounce (performance)
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Atualizar ano do footer dinamicamente
document.addEventListener('DOMContentLoaded', () => {
    const footer = document.querySelector('.footer');
    if (footer) {
        const currentYear = new Date().getFullYear();
        footer.textContent = footer.textContent.replace('2025', currentYear);
    }
});