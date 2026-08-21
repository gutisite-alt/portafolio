<?php
// ============================================================
// OBTENER MARCAS (GET) — ANAYA ERP
// ============================================================

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');

// Verificar sesión activa
if (!isset($_SESSION['loggedIn']) || $_SESSION['loggedIn'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado. Inicie sesión.']);
    exit;
}

require_once '../config/db_connect.php';

try {
    // Inicialización automática de la tabla de marcas (Self-healing)
    $checkTable = $pdo->query("SHOW TABLES LIKE 'brands'")->fetch();
    if (!$checkTable) {
        $createSQL = "CREATE TABLE IF NOT EXISTS brands (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
        $pdo->exec($createSQL);

        // Sembrar valores por defecto
        $defaultBrands = [
            'Anaya Comfort',
            'Anaya Active',
            'Ikea',
            'Sony',
            'Phillips'
        ];

        $insertStmt = $pdo->prepare('INSERT IGNORE INTO brands (name) VALUES (:name)');
        foreach ($defaultBrands as $brandName) {
            $insertStmt->execute(['name' => $brandName]);
        }
    }

    $stmt = $pdo->query('SELECT id, name FROM brands ORDER BY name ASC');
    $brands = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'brands' => $brands
    ]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al obtener marcas: ' . $e->getMessage()]);
}
?>
