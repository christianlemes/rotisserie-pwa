<?php
// ======================================================
// [DB] — Fábrica de conexão PDO com tratamento de erro
// Uso: $pdo = get_pdo();
// ======================================================
require_once __DIR__ . '/config.php';

function get_pdo(): PDO {
  static $pdo = null;

  if ($pdo instanceof PDO) {
    return $pdo;
  }

  try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS, [
      PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Exceções em erros
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Arrays associativos
      PDO::ATTR_EMULATE_PREPARES   => false,                  // Prepareds nativos
    ]);
    return $pdo;
  } catch (PDOException $e) {
    // Em projeto escolar podemos exibir a mensagem; em prod, jamais.
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
      'ok'    => false,
      'error' => 'DB_CONNECTION_FAILED',
      'detail'=> $e->getMessage()
    ]);
    exit;
  }
}
