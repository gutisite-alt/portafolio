<?php
// ============================================================
// OBTENER LISTA DE PROVEEDORES (GET) — ANAYA ERP
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
    // Si la tabla no existe, la creamos automáticamente para facilitar la instalación
    $checkTable = $pdo->query("SHOW TABLES LIKE 'suppliers'")->fetch();
    if (!$checkTable) {
        $createSQL = "CREATE TABLE IF NOT EXISTS suppliers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            custom_id VARCHAR(20) NOT NULL UNIQUE,
            name VARCHAR(150) NOT NULL,
            contact VARCHAR(100) NULL,
            phone VARCHAR(30) NULL,
            email VARCHAR(100) NULL,
            address VARCHAR(255) NULL,
            status ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_supplier_name (name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
        $pdo->exec($createSQL);
    }

    $stmt = $pdo->query('SELECT id, custom_id, name, contact, phone, email, address, status FROM suppliers ORDER BY id DESC');
    $suppliers = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'suppliers' => $suppliers
    ]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al obtener proveedores: ' . $e->getMessage()]);
}
?>
