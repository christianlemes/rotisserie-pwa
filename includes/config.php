<?php
// ======================================================
// [CONFIG] — Constantes do projeto
// Ajuste os valores conforme seu ambiente local (XAMPP)
// ======================================================

// --- Banco de dados (MySQL/MariaDB no XAMPP) ---
define('DB_DSN',  'mysql:host=127.0.0.1;dbname=rotisserie_db;charset=utf8mb4');
define('DB_USER', 'root');
define('DB_PASS', ''); // XAMPP costuma vir sem senha para root

// --- Identidade visual / negócio (se quiser usar em PHP) ---
define('APP_NAME', 'Rotisserie Israel');

// --- Futuros: endereço/lat/lng para o mapa; OAuth Client ID etc. ---
