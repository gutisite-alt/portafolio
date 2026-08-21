<?php
// Configuración de la base de datos MySQL
define('DB_HOST', 'sql305.ezyro.com');
define('DB_NAME', 'ezyro_42243718_gutisite');
define('DB_USER', 'ezyro_42243718');
define('DB_PASS', 'America*1990');
define('DB_CHARSET', 'utf8mb4');

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (\PDOException $e) {
    // Si hay un error, respondemos con código 500 y finalizamos
    header('Content-Type: application/json', true, 500);
    echo json_encode([
        'error' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit;
}
