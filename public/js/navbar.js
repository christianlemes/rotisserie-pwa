// ======================================================
// [NAVBAR.JS]
// - Controle do menu mobile (botão hambúrguer)
// - Backdrop para fechar clicando fora
// - Fecha menu ao clicar em qualquer link
// ======================================================

document.addEventListener('DOMContentLoaded', () => {
  // -----------------------------
  // [Refs de elementos do DOM]
  // -----------------------------
  const btn   = document.getElementById('navToggle');   // botão 3 barrinhas
  const menu  = document.getElementById('mobileMenu');  // <nav> com os links

  if (!btn || !menu) return; // se não existir no HTML, sai quieto

  // -----------------------------
  // [Backdrop] — fundo escuro
  // -----------------------------
  let backdrop = document.querySelector('.nav-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);
  }

  // -----------------------------
  // [Funções de abrir/fechar]
  // -----------------------------
  function openMenu() {
    btn.classList.add('is-open');
    menu.classList.add('is-open');
    backdrop.classList.add('show');
    document.body.classList.add('no-scroll');
    btn.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    btn.classList.remove('is-open');
    menu.classList.remove('is-open');
    backdrop.classList.remove('show');
    document.body.classList.remove('no-scroll');
    btn.setAttribute('aria-expanded', 'false');
  }

  function toggleMenu() {
    const aberto = menu.classList.contains('is-open');
    if (aberto) closeMenu();
    else openMenu();
  }

  // -----------------------------
  // [Eventos principais]
  // -----------------------------
  // Clica nas 3 barrinhas → abre/fecha menu
  btn.addEventListener('click', (e) => {
    e.preventDefault(); // garante que não dispare nada estranho
    toggleMenu();
  });

  // Clicar no backdrop → fecha menu
  backdrop.addEventListener('click', closeMenu);

  // Clicar em qualquer link do menu:
  // - fecha o menu
  // - deixa o navegador seguir o href normalmente
  menu.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;     // clicou em outra coisa dentro do nav
    closeMenu();           // fecha o menu
    // NÃO damos preventDefault aqui → o link navega normalmente
  });

  // Tecla ESC → fecha menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
});
