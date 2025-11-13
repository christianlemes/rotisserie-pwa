<?php
// ======================================================================
// API — Rotisserie Israel (ETAPA 8+)
// Linguagens: PHP (API), MySQL (DB), HTML/CSS/JS (front separado)
// Objetivo: Endpoints JSON para Cardápio, Carrinho, Pedido e Sessão
// Observação: Login agora via endpoint "login" (mantido alias login_simulado)
// ======================================================================

// -------------------------------------------------------------
// [Cabeçalhos] — JSON por padrão (CORS opcional se precisar)
// -------------------------------------------------------------
header('Content-Type: application/json; charset=utf-8');
// Se for chamar a API de outro domínio/porta, libere CORS:
// header('Access-Control-Allow-Origin: *');
// header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
// header('Access-Control-Allow-Headers: Content-Type, Authorization');
// if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

// -------------------------------------------------------------
// [Includes] — sessão cedo + conexão PDO
// -------------------------------------------------------------
require_once __DIR__ . '/includes/session_boot.php';
require_once __DIR__ . '/includes/db.php';
$pdo = get_pdo();

// -------------------------------------------------------------
// [Helpers] — utilitários para entrada/saída
// -------------------------------------------------------------
function json_input(): array {
  $raw = file_get_contents('php://input');
  if (!$raw) return [];
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}
function ok($data = [], int $code = 200): void {
  http_response_code($code);
  echo json_encode(['ok' => true, 'data' => $data], JSON_UNESCAPED_UNICODE);
  exit;
}
function fail(string $msg, int $code = 400, $extra = null): void {
  http_response_code($code);
  $out = ['ok' => false, 'error' => $msg];
  if ($extra !== null) $out['detail'] = $extra;
  echo json_encode($out, JSON_UNESCAPED_UNICODE);
  exit;
}

// -------------------------------------------------------------
// [Roteamento] — action via GET/POST?action=...
// -------------------------------------------------------------
$action = $_GET['action'] ?? $_POST['action'] ?? null;
$body   = json_input();
if (!$action) fail('NO_ACTION');

// ======================================================================
// [1] LISTAR_ITENS — GET /api.php?action=listar_itens
// Retorna cardápio disponível com nome do produto
// ======================================================================
if ($action === 'listar_itens') {
  $sql = "SELECT 
            c.id_item,
            p.nome_produto,
            p.descricao,
            c.categoria,
            c.preco,
            c.disponivel
          FROM cardapio c
          JOIN produtos p ON p.id_produto = c.id_produto
          WHERE c.disponivel = 1
          ORDER BY c.categoria, p.nome_produto";
  $rows = $pdo->query($sql)->fetchAll();
  ok($rows);
}

// ======================================================================
// [2] LOGIN — POST /api.php?action=login  (alias: login_simulado)
// body: { "email": "a@b.com", "nome": "Fulano" }
//
// Regras atuais (etapa didática):
// - Se o e-mail existir em clientes, reaproveita o cadastro
// - Se não existir, cria cliente com nome + email
// - Salva na sessão: $_SESSION['user'] = [id, nome, email]
// Obs.: Mantido o nome antigo "login_simulado" como alias para não quebrar front
// ======================================================================
if ($action === 'login' || $action === 'login_simulado') {
  $email = trim($body['email'] ?? '');
  $nome  = trim($body['nome']  ?? '');

  if ($email === '' || $nome === '') fail('NOME_E_EMAIL_OBRIGATORIOS');

  // Busca usuário existente
  $st = $pdo->prepare("SELECT id_cliente, nome, email FROM clientes WHERE email = ?");
  $st->execute([$email]);
  $u = $st->fetch();

  if (!$u) {
    // Cria novo cliente
    $ins = $pdo->prepare("INSERT INTO clientes (nome, email) VALUES (?, ?)");
    $ins->execute([$nome, $email]);
    $id  = (int)$pdo->lastInsertId();
    $_SESSION['user'] = [
      'id'    => $id,
      'nome'  => $nome,
      'email' => $email
    ];
  } else {
    // Reaproveita cadastro existente
    $_SESSION['user'] = [
      'id'    => (int)$u['id_cliente'],
      'nome'  => $u['nome'],
      'email' => $u['email']
    ];
  }

  ok($_SESSION['user']);
}

// ======================================================================
// [3] ME / SESSION_STATUS
// - GET /api.php?action=me
// - GET /api.php?action=session_status
//
// Retorna dados da sessão do usuário (ou null se não estiver logado).
// Útil para o front saber se a pessoa pode fazer pedido / carrinho.
// ======================================================================
if ($action === 'me' || $action === 'session_status') {
  if (isset($_SESSION['user'])) {
    ok($_SESSION['user']);
  } else {
    // Mantém padrão: ok=false quando não logado
    fail('NO_SESSION', 200);
  }
}

// ======================================================================
// [4] LOGOUT — POST /api.php?action=logout
// Apaga sessão (user + carrinho)
// ======================================================================
if ($action === 'logout') {
  $_SESSION = [];
  if (session_status() === PHP_SESSION_ACTIVE) session_destroy();
  ok(['message' => 'logout']);
}

// ======================================================================
// [5] CART_ADD — POST /api.php?action=cart_add
// body: { "id_item": 3, "qtd": 2 }
// Armazena carrinho na sessão: $_SESSION['cart'][id_item] = qtd
// - Agora exige usuário logado (SESSION user)
// ======================================================================
if ($action === 'cart_add') {
  if (!isset($_SESSION['user'])) {
    // front pode redirecionar para login quando receber este erro
    fail('LOGIN_REQUERIDO', 401);
  }

  $id_item = (int)($body['id_item'] ?? 0);
  $qtd     = (int)($body['qtd']     ?? 1);
  if ($id_item <= 0 || $qtd <= 0) fail('INPUT_INVALIDO');

  $_SESSION['cart'] = $_SESSION['cart'] ?? [];
  $_SESSION['cart'][$id_item] = ($_SESSION['cart'][$id_item] ?? 0) + $qtd;

  ok(['cart' => $_SESSION['cart']]);
}

// ======================================================================
// [6] CART_LIST — GET /api.php?action=cart_list
// Retorna itens do carrinho com nome e preço atuais
// (também exige usuário logado)
// ======================================================================
if ($action === 'cart_list') {
  if (!isset($_SESSION['user'])) {
    fail('LOGIN_REQUERIDO', 401);
  }

  $cart = $_SESSION['cart'] ?? [];
  if (!$cart) ok([]);

  $ids = implode(',', array_map('intval', array_keys($cart)));
  // Busca nomes/preços
  $sql = "SELECT c.id_item, p.nome_produto, c.preco
          FROM cardapio c
          JOIN produtos p ON p.id_produto=c.id_produto
          WHERE c.id_item IN ($ids)";
  $items = $pdo->query($sql)->fetchAll();

  // Anexa quantidades
  foreach ($items as &$it) {
    $id = (int)$it['id_item'];
    $it['qtd'] = $cart[$id] ?? 0;
    $it['subtotal'] = round($it['qtd'] * (float)$it['preco'], 2);
  }
  unset($it);

  // Total
  $total = array_sum(array_column($items, 'subtotal'));
  ok(['items' => $items, 'total' => $total]);
}

// ======================================================================
// [7] CART_DEL — POST /api.php?action=cart_del
// body: { "id_item": 3 } → remove do carrinho
// (também exige usuário logado)
// ======================================================================
if ($action === 'cart_del') {
  if (!isset($_SESSION['user'])) {
    fail('LOGIN_REQUERIDO', 401);
  }

  $id_item = (int)($body['id_item'] ?? 0);
  if ($id_item <= 0) fail('INPUT_INVALIDO');
  if (isset($_SESSION['cart'][$id_item])) unset($_SESSION['cart'][$id_item]);
  ok(['cart' => $_SESSION['cart'] ?? []]);
}

// ======================================================================
// [8] FINALIZAR — POST /api.php?action=finalizar
// body: { "rua": "X", "num_casa": "123", "bairro": "Centro" }
// Regras desta etapa (didático):
// - REQUER usuário na sessão
// - Calcula total com base na tabela cardápio
// - Cria pedido + itens_pedido (preço “congelado” do momento)
// - Limpa carrinho
// ======================================================================
if ($action === 'finalizar') {
  // 8.1) Checagens iniciais
  if (!isset($_SESSION['user'])) fail('LOGIN_REQUERIDO', 401);
  $user_id = (int)$_SESSION['user']['id'];

  $cart = $_SESSION['cart'] ?? [];
  if (!$cart) fail('CARRINHO_VAZIO');

  // 8.2) Busca preços atuais dos itens do carrinho
  $ids = implode(',', array_map('intval', array_keys($cart)));
  $map = []; // id_item => preco
  $sql = "SELECT id_item, preco FROM cardapio WHERE id_item IN ($ids)";
  foreach ($pdo->query($sql)->fetchAll() as $r) {
    $map[(int)$r['id_item']] = (float)$r['preco'];
  }

  // 8.3) Totaliza
  $total = 0.0;
  foreach ($cart as $id_item => $qtd) {
    $preco = $map[(int)$id_item] ?? 0;
    $total += $preco * (int)$qtd;
  }

  // 8.4) Cria pedido
  $rua     = $body['rua']      ?? null;
  $num     = $body['num_casa'] ?? null;
  $bairro  = $body['bairro']   ?? null;

  $pdo->beginTransaction();
  try {
    $insPed = $pdo->prepare(
      "INSERT INTO pedidos (id_cliente, rua, num_casa, bairro, valor_total)
       VALUES (?,?,?,?,?)"
    );
    $insPed->execute([$user_id, $rua, $num, $bairro, $total]);
    $pedido_id = (int)$pdo->lastInsertId();

    // 8.5) Insere itens com preço praticado no momento
    $insItem = $pdo->prepare(
      "INSERT INTO itens_pedido (id_pedido, id_item, qtd, preco) VALUES (?,?,?,?)"
    );
    foreach ($cart as $id_item => $qtd) {
      $preco = $map[(int)$id_item] ?? 0;
      $insItem->execute([$pedido_id, (int)$id_item, (int)$qtd, $preco]);
    }

    $pdo->commit();

    // 8.6) Limpa carrinho após finalizar
    unset($_SESSION['cart']);

    ok(['pedido_id' => $pedido_id, 'total' => $total]);
  } catch (Throwable $e) {
    $pdo->rollBack();
    fail('ERRO_FINALIZAR', 500, $e->getMessage());
  }
}

// ======================================================================
// [DEFAULT] — Ação desconhecida
// ======================================================================
fail('UNKNOWN_ACTION', 404);
