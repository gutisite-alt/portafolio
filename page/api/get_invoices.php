<?php
// ============================================================
// OBTENER HISTORIAL DE FACTURAS (GET) — ANAYA ERP
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
    $checkTable = $pdo->query("SHOW TABLES LIKE 'invoices'")->fetch();
    if (!$checkTable) {
        $createInvoices = "CREATE TABLE IF NOT EXISTS invoices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            custom_id VARCHAR(20) NOT NULL UNIQUE,
            invoice_number VARCHAR(30) NOT NULL UNIQUE,
            client_id INT NOT NULL,
            user_id INT NOT NULL,
            date DATE NOT NULL,
            subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            tax_rate INT NOT NULL DEFAULT 21,
            tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            status ENUM('Cobrada', 'Pendiente', 'Devuelta') NOT NULL DEFAULT 'Pendiente',
            payment_method VARCHAR(50) NOT NULL DEFAULT 'Tarjeta',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
            INDEX idx_invoice_date (date),
            INDEX idx_invoice_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
        $pdo->exec($createInvoices);
    }

    $checkItemsTable = $pdo->query("SHOW TABLES LIKE 'invoice_items'")->fetch();
    if (!$checkItemsTable) {
        $createItems = "CREATE TABLE IF NOT EXISTS invoice_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            invoice_id INT NOT NULL,
            product_id INT NOT NULL,
            qty INT NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
            INDEX idx_item_invoice (invoice_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
        $pdo->exec($createItems);
    }

    // Consultar cabeceras de facturas
    $stmt = $pdo->query('
        SELECT 
            i.id,
            i.custom_id,
            i.invoice_number,
            i.client_id,
            c.name AS client_name,
            c.document AS client_document,
            c.address AS client_address,
            c.city AS client_city,
            i.date,
            i.subtotal,
            i.tax_rate,
            i.tax_amount,
            i.discount,
            i.total,
            i.status,
            i.payment_method
        FROM invoices i
        JOIN clients c ON i.client_id = c.id
        ORDER BY i.id DESC
    ');
    $invoicesList = $stmt->fetchAll();

    // Consultar detalles de todas las facturas y mapear a sus cabeceras
    $invoices = [];
    foreach ($invoicesList as $inv) {
        $itemStmt = $pdo->prepare('
            SELECT 
                ii.product_id AS productId,
                ii.qty,
                ii.price,
                p.name,
                p.sku
            FROM invoice_items ii
            JOIN products p ON ii.product_id = p.id
            WHERE ii.invoice_id = :invoice_id
        ');
        $itemStmt->execute(['invoice_id' => $inv['id']]);
        $items = $itemStmt->fetchAll();

        $invoices[] = [
            'id' => $inv['id'],
            'customId' => $inv['custom_id'],
            'invoiceNumber' => $inv['invoice_number'],
            'clientId' => $inv['client_id'],
            'clientName' => $inv['client_name'],
            'clientDocument' => $inv['client_document'],
            'clientAddress' => $inv['client_address'],
            'clientCity' => $inv['client_city'],
            'date' => $inv['date'],
            'subtotal' => floatval($inv['subtotal']),
            'taxRate' => intval($inv['tax_rate']),
            'taxAmount' => floatval($inv['tax_amount']),
            'discount' => floatval($inv['discount']),
            'total' => floatval($inv['total']),
            'status' => $inv['status'],
            'paymentMethod' => $inv['payment_method'],
            'products' => array_map(function($item) {
                return [
                    'productId' => intval($item['productId']),
                    'qty' => intval($item['qty']),
                    'price' => floatval($item['price']),
                    'name' => $item['name'],
                    'sku' => $item['sku']
                ];
            }, $items)
        ];
    }

    echo json_encode([
        'success' => true,
        'invoices' => $invoices
    ]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al obtener las facturas: ' . $e->getMessage()]);
}
?>
