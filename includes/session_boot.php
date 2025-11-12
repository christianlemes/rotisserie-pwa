<?php
// ======================================================
// [SESSÃO] — Inicializa a sessão o mais cedo possível
// Incluir este arquivo no topo de páginas PHP e da API.
// ======================================================
if (session_status() === PHP_SESSION_NONE) {
  session_start();
}
