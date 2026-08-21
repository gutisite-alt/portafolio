<?php
// ============================================================
// OBTENER CATEGORÍAS (GET) — ANAYA ERP
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
    // Inicialización automática de la tabla de categorías (Self-healing)
    $checkTable = $pdo->query("SHOW TABLES LIKE 'categories'")->fetch();
    if (!$checkTable) {
        $createSQL = "CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
        $pdo->exec($createSQL);

        // Sembrar valores por defecto
        $defaultCategories = [
            'Sofás y Descanso',
            'Muebles de Salón',
            'Electrodomésticos',
            'Dormitorio',
            'Menaje y Hogar'
        ];

        $insertStmt = $pdo->prepare('INSERT IGNORE INTO categories (name) VALUES (:name)');
        foreach ($defaultCategories as $catName) {
            $insertStmt->execute(['name' => $catName]);
        }
    }

    $stmt = $pdo->query('SELECT id, name FROM categories ORDER BY name ASC');
    $categories = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'categories' => $categories
    ]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al obtener categorías: ' . $e->getMessage()]);
}
?>
