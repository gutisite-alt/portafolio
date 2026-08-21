<?php
// ============================================================
// OBTENER HISTORIAL DE MOVIMIENTOS KARDEX (GET) — ANAYA ERP
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
    $checkTable = $pdo->query("SHOW TABLES LIKE 'inventory_movements'")->fetch();
    if (!$checkTable) {
        $createMovsSQL = "CREATE TABLE IF NOT EXISTS inventory_movements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            custom_id VARCHAR(20) NOT NULL UNIQUE,
            product_id INT NOT NULL,
            qty INT NOT NULL,
            type ENUM('Entrada', 'Salida', 'Ajuste') NOT NULL,
            reason VARCHAR(255) NOT NULL,
            date DATE NOT NULL,
            user_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
            INDEX idx_movement_date (date),
            INDEX idx_movement_product (product_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
        $pdo->exec($createMovsSQL);
    }

    $stmt = $pdo->query('
        SELECT 
            m.id,
            m.custom_id,
            m.product_id,
            p.sku,
            p.name AS product_name,
            m.qty,
            m.type,
            m.reason,
            m.date,
            u.name AS user_name
        FROM inventory_movements m
        JOIN products p ON m.product_id = p.id
        LEFT JOIN users u ON m.user_id = u.id
        ORDER BY m.id DESC
    ');
    $movements = $stmt->fetchAll();

    $formatted = array_map(function($m) {
        return [
            'id' => $m['id'],
            'customId' => $m['custom_id'],
            'productId' => intval($m['product_id']),
            'sku' => $m['sku'],
            'productName' => $m['product_name'],
            'qty' => intval($m['qty']),
            'type' => $m['type'],
            'reason' => $m['reason'],
            'date' => $m['date'],
            'user' => $m['user_name'] ?: 'Sistema'
        ];
    }, $movements);

    echo json_encode([
        'success' => true,
        'movements' => $formatted
    ]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al obtener historial de Kardex: ' . $e->getMessage()]);
}
?>
