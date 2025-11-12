/* ============================================================
   service-worker.js — PWA da Rotisserie Israel
   OBJETIVO: cache offline básico (páginas + assets) e atualização suave
   NOTA: altere CACHE_VERSION para forçar atualização no cliente
============================================================ */
const CACHE_VERSION = 'v1.0.1'; // <-- subi a versão pra forçar update
const CACHE_STATIC  = `rotisserie-static-${CACHE_VERSION}`;
const CACHE_DYNAMIC = `rotisserie-dyn-${CACHE_VERSION}`;
const OFFLINE_URL   = '/offline.html';

/* ------------------------------------------------------------
   [Pré-cache] — arquivos essenciais para abrir offline
   ATENÇÃO: liste APENAS o que existe de verdade no projeto
------------------------------------------------------------ */
const PRECACHE_URLS = [
  '/',                    // ok se o docroot é a raiz do projeto
  '/index.html',
  '/cardapio.html',
  '/carrinho.html',
  '/login.html',
  '/offline.html',
  '/manifest.webmanifest',

  // CSS
  '/public/css/base.css',
  '/public/css/index.css',
  '/public/css/cardapio.css',
  '/public/css/login.css',

  // JS
  '/public/js/index.js',
  '/public/js/cardapio.js',
  '/public/js/carrinho.js',
  '/public/js/login.js',
  '/public/js/pwa-register.js',

  // ÍCONES (corrigido: assets/icons e não public/icons)
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png'
];

/* ============================================================
   [Install] — abre cache estático e pré-cacheia arquivos
   Versão com diagnóstico: se alguma URL falhar, mostramos no console
============================================================ */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_STATIC);

    // Tenta cada URL e registra falhas, sem quebrar a instalação
    const results = await Promise.allSettled(
      PRECACHE_URLS.map(u =>
        cache.add(new Request(u, { cache: 'reload' }))
      )
    );

    const fails = results
      .map((r, i) => ({ r, url: PRECACHE_URLS[i] }))
      .filter(x => x.r.status === 'rejected');

    if (fails.length) {
      console.error('[SW] Falhou ao pré-cachear estas URLs:');
      fails.forEach(x => console.error('  ->', x.url));
      // Se quiser abortar a instalação quando houver erro, descomente:
      // throw new Error('Precache falhou.');
    }

    self.skipWaiting(); // ativa a versão nova imediatamente
  })());
});

/* ============================================================
   [Activate] — limpa caches antigos e assume as páginas
============================================================ */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(k => k.startsWith('rotisserie-') && k !== CACHE_STATIC && k !== CACHE_DYNAMIC)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ============================================================
   [Fetch] Estratégias por tipo de recurso
   - HTML: Network First (offline -> cache -> offline.html)
   - API (/api.php): Network First
   - CSS/JS/Imagens/Fontes: Stale-While-Revalidate
============================================================ */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Só intercepta o mesmo host
  if (url.origin !== location.origin) return;

  const isHTML  = request.destination === 'document' || url.pathname.endsWith('.html');
  const isAsset = ['style', 'script', 'image', 'font'].includes(request.destination);
  const isAPI   = url.pathname.endsWith('/api.php') || url.pathname === '/api.php';

  if (isHTML) {
    event.respondWith(networkFirst(request));
  } else if (isAPI) {
    event.respondWith(networkFirst(request));
  } else if (isAsset) {
    event.respondWith(staleWhileRevalidate(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

/* -------------------- Estratégias ---------------------- */
// [1] Network First: tenta rede; se cair, usa cache; senão offline.html
async function networkFirst(request) {
  try {
    const fresh = await fetch(request, { cache: 'no-store' });
    const cache = await caches.open(CACHE_DYNAMIC);
    cache.put(request, fresh.clone());
    return fresh;
  } catch (err) {
    const cached = await caches.match(request);
    return cached || caches.match(OFFLINE_URL);
  }
}

// [2] Stale-While-Revalidate: entrega cache rápido e atualiza por trás
async function staleWhileRevalidate(request) {
  const cache   = await caches.open(CACHE_DYNAMIC);
  const cached  = await cache.match(request);
  const network = fetch(request).then((res) => {
    cache.put(request, res.clone());
    return res;
  }).catch(() => null);

  return cached || network || caches.match(OFFLINE_URL);
}

/* ============================================================
   [Mensagens] — permite "pular espera" quando há nova versão
============================================================ */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
