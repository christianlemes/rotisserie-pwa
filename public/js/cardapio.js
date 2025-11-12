// ======================================================================
// [CARDAPIO.JS]
// Objetivo: buscar itens do cardápio e oferecer filtros UX:
// - Busca por texto
// - Botões de categoria (dinâmicos do backend)
// - Sincroniza filtro com URL (?cat=...)
// - Estados de vazio / loading
// ======================================================================

// -------------------------------
// [Estado] — cache local
// -------------------------------
let ITENS = [];              // lista vinda da API
let CATEGORIAS = [];         // categorias únicas
let CAT_ATIVA = null;        // categoria selecionada (string ou null)

// -------------------------------
// [DOM helpers] — atalhos
// -------------------------------
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// -------------------------------
// [Init] — boot da tela
// -------------------------------
boot();
async function boot() {
  showLoading(true);
  await listar();          // carrega ITENS da API
  montarCategorias();      // extrai categorias e monta botões
  aplicarFiltroDaURL();    // se vier ?cat=...
  render();                // desenha lista
  showLoading(false);
}

// ======================================================================
// [API] — chama endpoints
// ======================================================================
async function listar() {
  const r = await fetch('api.php?action=listar_itens');
  const j = await r.json();
  if (!j.ok) {
    alert('Erro ao listar cardápio');
    ITENS = [];
    return;
  }
  ITENS = j.data || [];

  // Normaliza campos que o front usa
  ITENS = ITENS.map(x => ({
    id_item: Number(x.id_item),
    nome: x.nome_produto,
    descricao: x.descricao ?? '',
    categoria: x.categoria ?? 'Outros',
    preco: Number(x.preco),
    disponivel: Number(x.disponivel) === 1
  }));
}

// ======================================================================
// [Categorias] — extrai e monta barra de botões
// ======================================================================
function montarCategorias() {
  // Extrai categorias únicas (ordenadas)
  const set = new Set(ITENS.map(x => x.categoria));
  CATEGORIAS = Array.from(set).sort((a,b) => a.localeCompare(b, 'pt-BR'));

  const bar = $('#catBar');
  bar.innerHTML = '';

  // Botão "Todas"
  const btnAll = criaBotaoCat('Todas', null);
  bar.appendChild(btnAll);

  // Demais categorias
  for (const cat of CATEGORIAS) {
    bar.appendChild(criaBotaoCat(cat, cat));
  }

  atualizaEstadoBotoes();
}

function criaBotaoCat(rotulo, catValue) {
  const btn = document.createElement('button');
  btn.className = 'chip';
  btn.type = 'button';
  btn.setAttribute('role', 'tab');
  btn.dataset.cat = catValue === null ? '' : catValue;
  btn.textContent = rotulo;

  btn.addEventListener('click', () => {
    CAT_ATIVA = catValue;
    // Atualiza URL (sem recarregar) — UX: compartilhar link de categoria
    const url = new URL(window.location);
    if (CAT_ATIVA) url.searchParams.set('cat', CAT_ATIVA);
    else url.searchParams.delete('cat');
    history.replaceState({}, '', url);

    atualizaEstadoBotoes();
    render();
  });

  return btn;
}

function atualizaEstadoBotoes() {
  $$('#catBar .chip').forEach(b => {
    const val = b.dataset.cat || null;
    if (val === (CAT_ATIVA ?? null)) b.classList.add('active');
    else b.classList.remove('active');
  });
}

// Pega ?cat=... da URL e aplica
function aplicarFiltroDaURL() {
  const url = new URL(window.location);
  const cat = url.searchParams.get('cat');
  if (!cat) { CAT_ATIVA = null; return; }
  CAT_ATIVA = CATEGORIAS.includes(cat) ? cat : null;
}

// ======================================================================
// [Render] — desenha cards
// ======================================================================
function render() {
  const root = $('#lista');
  const empty = $('#empty');
  root.innerHTML = '';

  // Aplica filtros combinados (categoria + texto)
  const texto = ($('#filtro').value || '').toLowerCase().trim();

  let lista = ITENS.filter(x => x.disponivel);
  if (CAT_ATIVA) lista = lista.filter(x => x.categoria === CAT_ATIVA);
  if (texto) {
    lista = lista.filter(x =>
      (x.nome ?? '').toLowerCase().includes(texto) ||
      (x.categoria ?? '').toLowerCase().includes(texto)
    );
  }

  // Estado vazio amigável
  if (lista.length === 0) {
    root.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }
  root.classList.remove('hidden');
  empty.classList.add('hidden');

  // Renderizar cards
  for (const it of lista) {
    const card = document.createElement('article');
    card.className = 'card item-card';
    card.innerHTML = `
      <!-- Cabeçalho: nome + badge de categoria -->
      <div class="item-head">
        <h3 class="item-title">${it.nome}</h3>
        <span class="badge">${it.categoria}</span>
      </div>

      <!-- Descrição enxuta -->
      <p class="item-desc">${it.descricao || '—'}</p>

      <!-- Preço + ação -->
      <div class="item-foot">
        <div class="price">R$ ${it.preco.toFixed(2)}</div>
        <div class="actions">
          <input type="number" min="1" value="1" class="qtd" aria-label="Quantidade" />
          <button class="btn add" data-id="${it.id_item}">Adicionar</button>
        </div>
      </div>
    `;
    root.appendChild(card);
  }

  // Liga eventos "Adicionar"
  root.querySelectorAll('.add').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.id);
      const qtd = Number(btn.closest('.item-foot').querySelector('.qtd').value || 1);
      await addCarrinho(id, qtd);
    });
  });
}

// ======================================================================
// [API Carrinho] — add
// ======================================================================
async function addCarrinho(id_item, qtd) {
  const r = await fetch('api.php?action=cart_add', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ id_item, qtd })
  });
  const j = await r.json();
  if (j.ok) toast('Adicionado ao carrinho!');
  else alert('Falhou: ' + (j.error || 'desconhecido'));
}

// ======================================================================
// [Busca] — listeners
// ======================================================================
$('#filtro').addEventListener('input', () => render());
$('#btnLimpar').addEventListener('click', () => {
  $('#filtro').value = '';
  render();
});
$('#btnLimparTudo').addEventListener('click', () => {
  // limpa busca e categoria
  $('#filtro').value = '';
  CAT_ATIVA = null;
  const url = new URL(window.location);
  url.searchParams.delete('cat');
  history.replaceState({}, '', url);
  atualizaEstadoBotoes();
  render();
});

// ======================================================================
// [UX helpers] — loading + toast simples
// ======================================================================
function showLoading(show) {
  if (show) {
    document.body.classList.add('loading');
    if (!$('#loader')) {
      const el = document.createElement('div');
      el.id = 'loader';
      el.className = 'loader';
      el.innerHTML = '<div class="spinner" aria-label="Carregando"></div>';
      document.body.appendChild(el);
    }
  } else {
    document.body.classList.remove('loading');
    $('#loader')?.remove();
  }
}

let toastTimer = null;
function toast(msg) {
  let el = $('#toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}
