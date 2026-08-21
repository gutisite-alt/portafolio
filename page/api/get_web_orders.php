<?php
// ============================================================
// OBTENER LISTA DE SOLICITUDES DE PEDIDOS WEB (GET) — ANAYA ERP
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
    // 1. Asegurar existencia de las tablas
    $pdo->exec("CREATE TABLE IF NOT EXISTS web_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        custom_id VARCHAR(20) NOT NULL UNIQUE,
        order_number VARCHAR(50) NOT NULL UNIQUE,
        client_name VARCHAR(150) NOT NULL,
        client_document VARCHAR(50) NOT NULL,
        client_email VARCHAR(150) NOT NULL,
        client_phone VARCHAR(50) NOT NULL,
        client_address VARCHAR(255) NOT NULL,
        client_city VARCHAR(100) NOT NULL,
        preferred_store VARCHAR(100) NOT NULL,
        comments TEXT NULL,
        total DECIMAL(10,2) NOT NULL,
        status ENUM('Pendiente', 'Procesado', 'Cancelado') DEFAULT 'Pendiente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    $pdo->exec("CREATE TABLE IF NOT EXISTS web_order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        web_order_id INT NOT NULL,
        product_id INT NOT NULL,
        qty INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (web_order_id) REFERENCES web_orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    // 2. Consultar pedidos
    $stmt = $pdo->query("SELECT * FROM web_orders ORDER BY created_at DESC");
    $orders = $stmt->fetchAll();

    $result = [];
    foreach ($orders as $order) {
        // Obtener ítems del pedido actual con detalles del producto
        $itemsStmt = $pdo->prepare("
            SELECT woi.*, p.name AS product_name, p.sku AS product_sku
            FROM web_order_items woi
            JOIN products p ON woi.product_id = p.id
            WHERE woi.web_order_id = :web_order_id
        ");
        $itemsStmt->execute(['web_order_id' => $order['id']]);
        $order['items'] = $itemsStmt->fetchAll();
        $result[] = $order;
    }

    echo json_encode([
        'success' => true,
        'orders' => $result
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al consultar las solicitudes: ' . $e->getMessage()
    ]);
}
?>
