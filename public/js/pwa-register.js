// ============================================================
// pwa-register.js — registra o SW e lida com updates
// ============================================================
(function() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/service-worker.js');

      // se já existe uma versão esperando, oferece atualizar
      if (reg.waiting) showUpdateBar(reg);

      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBar(reg);
          }
        });
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Novo service worker ativo.');
      });
    } catch (e) {
      console.warn('[PWA] Falha ao registrar o service worker:', e);
    }
  });

  function showUpdateBar(reg) {
    const bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;left:10px;right:10px;bottom:10px;background:#1D5131;color:#fff;padding:10px;border-radius:12px;z-index:9999;display:flex;justify-content:space-between;align-items:center;font-family:sans-serif';
    bar.innerHTML = `
      <span>Atualização disponível da Rotisserie. Recarregar agora?</span>
      <button style="background:#fff;color:#1D5131;border:none;border-radius:8px;padding:8px 12px;font-weight:700;cursor:pointer">Atualizar</button>
    `;
    bar.querySelector('button').onclick = () => {
      reg.waiting?.postMessage('SKIP_WAITING');
      setTimeout(() => window.location.reload(), 600);
    };
    document.body.appendChild(bar);
  }
})();
