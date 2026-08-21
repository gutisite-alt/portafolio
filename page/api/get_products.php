<?php
// ============================================================
// OBTENER LISTA DE PRODUCTOS (GET) — ANAYA ERP
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
    // Si la tabla no existe, la creamos automáticamente
    $checkTable = $pdo->query("SHOW TABLES LIKE 'products'")->fetch();
    if (!$checkTable) {
        $createSQL = "CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sku VARCHAR(50) NOT NULL UNIQUE,
            name VARCHAR(150) NOT NULL,
            brand VARCHAR(100) NULL,
            category VARCHAR(100) NULL,
            supplier_id INT NULL,
            buy_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            sell_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            stock INT NOT NULL DEFAULT 0,
            min_stock INT NOT NULL DEFAULT 0,
            weight VARCHAR(50) NULL,
            dimensions VARCHAR(100) NULL,
            image_url VARCHAR(255) NULL,
            description TEXT NULL,
            status ENUM('Disponible', 'Bajo Stock', 'Agotado') NOT NULL DEFAULT 'Disponible',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
            INDEX idx_product_sku (sku),
            INDEX idx_product_name (name),
            INDEX idx_product_category (category)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
        $pdo->exec($createSQL);
    }

    $stmt = $pdo->query('
        SELECT 
            p.id, 
            p.sku, 
            p.name, 
            p.brand, 
            p.category, 
            p.supplier_id, 
            p.buy_price, 
            p.sell_price, 
            p.stock, 
            p.min_stock, 
            p.weight, 
            p.dimensions, 
            p.image_url, 
            p.description, 
            p.status,
            s.name AS supplier_name
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        ORDER BY p.id DESC
    ');
    $products = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'products' => $products
    ]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al obtener productos: ' . $e->getMessage()]);
}
?>
