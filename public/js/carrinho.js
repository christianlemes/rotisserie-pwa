// ======================================================================
// [CARRINHO.JS]
// Objetivo: listar itens do carrinho (sessão), permitir remover itens,
// e finalizar compra gravando em "pedidos" + "itens_pedido".
// ======================================================================

const $ = (sel) => document.querySelector(sel);

// -------------------------------
// [API] — wrappers
// -------------------------------
async function cartList() {
  const r = await fetch('api.php?action=cart_list');
  return r.json();
}

async function cartDel(id_item) {
  const r = await fetch('api.php?action=cart_del', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ id_item })
  });
  return r.json();
}

async function finalizar(data) {
  const r = await fetch('api.php?action=finalizar', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(data)
  });
  return r.json();
}

async function me() {
  const r = await fetch('api.php?action=me');
  return r.json();
}

// -------------------------------
// [Render] — desenha carrinho
// -------------------------------
async function render() {
  const j = await cartList();

  const root = $('#lista');
  root.innerHTML = '';

  if (!j.ok) {
    root.innerHTML = `<div class="card">Erro ao carregar carrinho.</div>`;
    $('#total').style.display = 'none';
    return;
  }

  const items = j.data.items || [];
  const total = j.data.total || 0;

  if (items.length === 0) {
    root.innerHTML = `<div class="card">Seu carrinho está vazio.</div>`;
    $('#total').style.display = 'none';
    return;
  }

  for (const it of items) {
    const box = document.createElement('article');
    box.className = 'card';
    box.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:16px;">
        <div>
          <h3 style="margin:0;">${it.nome_produto}</h3>
          <small>Qtd: <strong>${it.qtd}</strong></small>
          <p style="margin:6px 0 0 0;">Preço: R$ ${Number(it.preco).toFixed(2)} &middot; Subtotal: <strong>R$ ${Number(it.subtotal).toFixed(2)}</strong></p>
        </div>
        <div>
          <button class="btn danger" data-id="${it.id_item}">Remover</button>
        </div>
      </div>
    `;
    root.appendChild(box);
  }

  // total
  $('#total').style.display = 'block';
  $('#vlr').textContent = `R$ ${Number(total).toFixed(2)}`;

  // eventos de remover
  root.querySelectorAll('.danger').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.id);
      const j = await cartDel(id);
      if (!j.ok) return alert('Falhou ao remover.');
      await render();
    });
  });
}

// -------------------------------
// [Finalizar] — valida e envia
// -------------------------------
$('#btnFinalizar').addEventListener('click', async () => {
  // Checa sessão (usuário logado). Nesta etapa usamos login simulado.
  const sess = await me();
  if (!sess.ok || !sess.data) {
    alert('Você precisa entrar antes de finalizar.\nVá em "Entrar" e faça login simulado.');
    return;
  }

  const rua = $('#rua').value.trim();
  const num_casa = $('#num').value.trim();
  const bairro = $('#bai').value.trim();

  if (!rua || !num_casa || !bairro) {
    alert('Preencha Rua, Número e Bairro.');
    return;
  }

  const resp = await finalizar({ rua, num_casa, bairro });
  if (!resp.ok) return alert('Erro ao finalizar: ' + (resp.error || 'desconhecido'));

  alert(`Pedido #${resp.data.pedido_id} finalizado!\nTotal: R$ ${Number(resp.data.total).toFixed(2)}`);
  // Recarrega a tela para refletir carrinho vazio:
  await render();
});

// -------------------------------
// [Boot]
// -------------------------------
render();
