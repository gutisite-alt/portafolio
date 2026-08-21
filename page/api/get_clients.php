<?php
// ============================================================
// OBTENER LISTA DE CLIENTES (GET) — ANAYA ERP
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
    $checkTable = $pdo->query("SHOW TABLES LIKE 'clients'")->fetch();
    if (!$checkTable) {
        $createSQL = "CREATE TABLE IF NOT EXISTS clients (
            id INT AUTO_INCREMENT PRIMARY KEY,
            custom_id VARCHAR(20) NOT NULL UNIQUE,
            name VARCHAR(150) NOT NULL,
            document VARCHAR(30) NOT NULL UNIQUE,
            phone VARCHAR(30) NULL,
            email VARCHAR(100) NULL,
            address VARCHAR(255) NULL,
            city VARCHAR(100) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_client_name (name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
        $pdo->exec($createSQL);
    }

    // Verificar si la tabla de facturas existe para calcular agregados
    $checkInvoicesTable = $pdo->query("SHOW TABLES LIKE 'invoices'")->fetch();
    if ($checkInvoicesTable) {
        $query = '
            SELECT 
                c.id, 
                c.custom_id, 
                c.name, 
                c.document, 
                c.phone, 
                c.email, 
                c.address, 
                c.city,
                COALESCE(COUNT(i.id), 0) AS history_count,
                COALESCE(SUM(i.total), 0) AS total_spent
            FROM clients c
            LEFT JOIN invoices i ON c.id = i.client_id
            GROUP BY c.id
            ORDER BY c.id DESC
        ';
    } else {
        $query = '
            SELECT 
                id, 
                custom_id, 
                name, 
                document, 
                phone, 
                email, 
                address, 
                city,
                0 AS history_count,
                0.00 AS total_spent
            FROM clients
            ORDER BY id DESC
        ';
    }

    $stmt = $pdo->query($query);
    $clients = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'clients' => $clients
    ]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al obtener clientes: ' . $e->getMessage()]);
}
?>
