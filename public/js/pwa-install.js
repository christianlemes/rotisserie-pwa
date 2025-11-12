/* ======================================================================
   PWA INSTALL — Lógica do botão/banner “Instalar”
   - Mostra banner apenas quando o navegador sinaliza que pode instalar
   - Some quando já estiver instalado (display-mode: standalone)
   - “Lembrar depois” esconde por 24h (ajuste se quiser)
   ====================================================================== */

// ------------------------------
// [Config] Chave e tempo de snooze
// ------------------------------
const PWA_SNOOZE_KEY = 'pwaInstallSnoozeUntil';
const PWA_SNOOZE_MS  = 24 * 60 * 60 * 1000; // 24h

// ------------------------------
// [Estado] Evento adiado do prompt
// ------------------------------
let deferredPrompt = null;

// ------------------------------
// [Utils] Está rodando instalado?
// ------------------------------
function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true; // iOS Safari
}

// ------------------------------
// [Utils] Snooze (lembrar depois)
// ------------------------------
function isSnoozed() {
  const until = Number(localStorage.getItem(PWA_SNOOZE_KEY) || 0);
  return Date.now() < until;
}
function snooze() {
  localStorage.setItem(PWA_SNOOZE_KEY, String(Date.now() + PWA_SNOOZE_MS));
}

// ------------------------------
// [UI] Monta banner no DOM (sem precisar editar HTML)
// ------------------------------
function ensureBanner() {
  if (document.getElementById('pwa-install-banner')) return;

  const banner = document.createElement('div');
  banner.className = 'pwa-install-banner';
  banner.id = 'pwa-install-banner';
  banner.innerHTML = `
    <div class="pwa-install-content">
      <div class="pwa-install-icon" aria-hidden="true"></div>
      <div class="pwa-install-text">
        <p class="pwa-install-title">Instale a Rotisserie Israel</p>
        <p class="pwa-install-sub">Acesse mais rápido e use mesmo sem internet.</p>
      </div>
    </div>
    <div class="pwa-install-actions">
      <button class="pwa-btn pwa-btn-later" id="pwa-install-later" type="button">Depois</button>
      <button class="pwa-btn pwa-btn-install" id="pwa-install-accept" type="button">Instalar</button>
      <button class="pwa-install-close" id="pwa-install-close" title="Fechar" aria-label="Fechar">×</button>
    </div>
  `;
  document.body.appendChild(banner);

  // Ações
  document.getElementById('pwa-install-accept').addEventListener('click', async () => {
    if (!deferredPrompt) return hideBanner();
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null; // limpa referência
    hideBanner();
    // opcional: registrar analytics do outcome (accepted / dismissed)
    console.log('[PWA] userChoice:', outcome);
  });

  document.getElementById('pwa-install-later').addEventListener('click', () => {
    snooze();
    hideBanner();
  });

  document.getElementById('pwa-install-close').addEventListener('click', () => {
    snooze(); // trata fechar como "lembrar depois"
    hideBanner();
  });
}

function showBanner() {
  const el = document.getElementById('pwa-install-banner');
  if (el) el.style.display = 'flex';
}
function hideBanner() {
  const el = document.getElementById('pwa-install-banner');
  if (el) el.style.display = 'none';
}

// ------------------------------
// [Fluxo] beforeinstallprompt → mostra banner custom
// ------------------------------
window.addEventListener('beforeinstallprompt', (e) => {
  // Bloqueia o mini-infobar nativo
  e.preventDefault();
  deferredPrompt = e;

  // Regras para exibir:
  if (isStandalone()) return;   // já instalado
  if (isSnoozed())   return;    // usuário pediu lembrar depois
  ensureBanner();
  showBanner();
});

// ------------------------------
// [Fluxo] Se já estiver instalado, nunca mostra
// ------------------------------
window.addEventListener('load', () => {
  if (isStandalone()) hideBanner();
});

// ------------------------------
// [Evento] app instalado → esconde e limpa snooze
// ------------------------------
window.addEventListener('appinstalled', () => {
  localStorage.removeItem(PWA_SNOOZE_KEY);
  hideBanner();
  console.log('[PWA] App instalado.');
});

// ------------------------------
// [iOS Hint] iOS não dispara beforeinstallprompt.
// Opcional: detectar iOS e mostrar dica “Compartilhar → Tela de Início”.
// ------------------------------
// (se quiser, posso incluir um hint elegante pra iOS depois)
