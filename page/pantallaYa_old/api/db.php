<?php
// Configuración de la base de datos
define('DB_HOST', 'sql305.ezyro.com');
define('DB_NAME', 'ezyro_42243718_gutisite');
define('DB_USER', 'ezyro_42243718');
define('DB_PASS', 'America*1990');

// Desactivar impresión de errores/advertencias en la salida (evita corromper respuestas JSON)
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Establecer cabeceras JSON comunes para la API
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

// Manejar peticiones OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => 'Fallo en la conexión de base de datos: ' . $e->getMessage()
    ]);
    exit;
}

// Iniciar sesión PHP de forma segura si no ha sido iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
