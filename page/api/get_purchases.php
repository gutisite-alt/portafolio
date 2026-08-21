<?php
// ============================================================
// OBTENER ÓRDENES DE COMPRA (GET) — ANAYA ERP
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
    // Inicialización automática de tablas (Self-healing)
    $checkTable = $pdo->query("SHOW TABLES LIKE 'purchase_orders'")->fetch();
    if (!$checkTable) {
        $createPO = "CREATE TABLE IF NOT EXISTS purchase_orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            custom_id VARCHAR(20) NOT NULL UNIQUE,
            po_number VARCHAR(30) NOT NULL UNIQUE,
            supplier_id INT NOT NULL,
            user_id INT NOT NULL,
            date DATE NOT NULL,
            total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            status ENUM('Pendiente', 'Aprobada', 'Recibida') NOT NULL DEFAULT 'Pendiente',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
            INDEX idx_po_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
        $pdo->exec($createPO);
    }

    $checkItemsTable = $pdo->query("SHOW TABLES LIKE 'purchase_order_items'")->fetch();
    if (!$checkItemsTable) {
        $createItems = "CREATE TABLE IF NOT EXISTS purchase_order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            purchase_order_id INT NOT NULL,
            product_id INT NOT NULL,
            qty INT NOT NULL,
            cost DECIMAL(10,2) NOT NULL,
            FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
            INDEX idx_item_po (purchase_order_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
        $pdo->exec($createItems);
    }

    // Consultar cabeceras de órdenes de compra
    $stmt = $pdo->query('
        SELECT 
            po.id,
            po.custom_id,
            po.po_number,
            po.supplier_id,
            s.name AS supplier_name,
            po.date,
            po.total,
            po.status
        FROM purchase_orders po
        JOIN suppliers s ON po.supplier_id = s.id
        ORDER BY po.id DESC
    ');
    $poList = $stmt->fetchAll();

    // Consultar detalles de todas las órdenes y mapear a sus cabeceras
    $purchaseOrders = [];
    foreach ($poList as $po) {
        $itemStmt = $pdo->prepare('
            SELECT 
                poi.product_id AS productId,
                poi.qty,
                poi.cost,
                p.name,
                p.sku
            FROM purchase_order_items poi
            JOIN products p ON poi.product_id = p.id
            WHERE poi.purchase_order_id = :purchase_order_id
        ');
        $itemStmt->execute(['purchase_order_id' => $po['id']]);
        $items = $itemStmt->fetchAll();

        $purchaseOrders[] = [
            'id' => $po['id'],
            'customId' => $po['custom_id'],
            'poNumber' => $po['po_number'],
            'supplierId' => $po['supplier_id'],
            'supplierName' => $po['supplier_name'],
            'date' => $po['date'],
            'total' => floatval($po['total']),
            'status' => $po['status'],
            'products' => array_map(function($item) {
                return [
                    'productId' => intval($item['productId']),
                    'qty' => intval($item['qty']),
                    'cost' => floatval($item['cost']),
                    'name' => $item['name'],
                    'sku' => $item['sku']
                ];
            }, $items)
        ];
    }

    echo json_encode([
        'success' => true,
        'purchaseOrders' => $purchaseOrders
    ]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al obtener órdenes de compra: ' . $e->getMessage()]);
}
?>
