// ======================================================
// NAV MOBILE — abre/fecha menu hambúrguer
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('navToggle');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;

  // Cria backdrop para clicar-fora
  let backdrop = document.querySelector('.nav-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);
  }

  // Abre/fecha
  function openMenu() {
    btn.classList.add('is-open');
    menu.classList.add('is-open');
    document.body.classList.add('no-scroll');
    btn.setAttribute('aria-expanded', 'true');
    backdrop.classList.add('show');
  }
  function closeMenu() {
    btn.classList.remove('is-open');
    menu.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    btn.setAttribute('aria-expanded', 'false');
    backdrop.classList.remove('show');
  }
  function toggleMenu() {
    menu.classList.contains('is-open') ? closeMenu() : openMenu();
  }

  btn.addEventListener('click', toggleMenu);
  backdrop.addEventListener('click', closeMenu);

  // Fecha ao clicar em um link do menu (boa UX)
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  // Fecha com tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
});
