<?php
// ============================================================
// EMITIR Y COBRAR FACTURA (POST) — ANAYA ERP
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

// Permitir solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido. Se requiere POST.']);
    exit;
}

require_once '../config/db_connect.php';

$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

$clientId = isset($input['clientId']) ? intval($input['clientId']) : 0;
$subtotal = isset($input['subtotal']) ? floatval($input['subtotal']) : 0.00;
$taxRate = isset($input['taxRate']) ? intval($input['taxRate']) : 21;
$taxAmount = isset($input['taxAmount']) ? floatval($input['taxAmount']) : 0.00;
$discount = isset($input['discount']) ? floatval($input['discount']) : 0.00;
$total = isset($input['total']) ? floatval($input['total']) : 0.00;
$status = isset($input['status']) ? trim($input['status']) : 'Pendiente';
$paymentMethod = isset($input['paymentMethod']) ? trim($input['paymentMethod']) : 'Tarjeta';
$products = isset($input['products']) ? $input['products'] : [];

if ($clientId <= 0 || empty($products)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Debe asociar un cliente y tener artículos en el carrito.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // 0. Verificar si existe una sesión de caja activa
    $stmtCash = $pdo->prepare('SELECT id, custom_id FROM cash_sessions WHERE status = "Abierta" LIMIT 1 FOR UPDATE');
    $stmtCash->execute();
    $activeCash = $stmtCash->fetch();
    
    if (!$activeCash) {
        throw new Exception("Para facturar en el POS, debe haber una sesión de caja abierta activa.");
    }
    
    $cashSessionId = intval($activeCash['id']);

    // 1. Verificar stock suficiente para todos los artículos
    foreach ($products as $item) {
        $pId = intval($item['productId']);
        $qty = intval($item['qty']);

        $stmt = $pdo->prepare('SELECT name, stock FROM products WHERE id = :id FOR UPDATE');
        $stmt->execute(['id' => $pId]);
        $prod = $stmt->fetch();

        if (!$prod) {
            throw new Exception("El producto con ID $pId no existe en el catálogo.");
        }

        if ($prod['stock'] < $qty) {
            throw new Exception("Stock insuficiente para '{$prod['name']}'. Disponible: {$prod['stock']} uds, solicitado: $qty uds.");
        }
    }

    // 2. Generar numeración de factura
    $stmt = $pdo->query('SELECT COALESCE(MAX(id), 0) AS max_id FROM invoices');
    $maxId = intval($stmt->fetch()['max_id']);
    $nextId = $maxId + 1;
    $invNum = 'FACT-2026-' . str_pad($nextId, 3, '0', STR_PAD_LEFT);
    $customId = 'INV-' . (400 + $nextId);
    $userId = isset($_SESSION['userId']) ? intval($_SESSION['userId']) : 1;
    $date = date('Y-m-d');

    // 3. Insertar cabecera de factura
    $stmt = $pdo->prepare('
        INSERT INTO invoices (custom_id, invoice_number, client_id, user_id, date, subtotal, tax_rate, tax_amount, discount, total, status, payment_method)
        VALUES (:custom_id, :invoice_number, :client_id, :user_id, :date, :subtotal, :tax_rate, :tax_amount, :discount, :total, :status, :payment_method)
    ');
    $stmt->execute([
        'custom_id' => $customId,
        'invoice_number' => $invNum,
        'client_id' => $clientId,
        'user_id' => $userId,
        'date' => $date,
        'subtotal' => $subtotal,
        'tax_rate' => $taxRate,
        'tax_amount' => $taxAmount,
        'discount' => $discount,
        'total' => $total,
        'status' => $status,
        'payment_method' => $paymentMethod
    ]);

    $invoiceId = $pdo->lastInsertId();

    // Asegurarse de que la tabla de movimientos de inventario existe
    $checkMovements = $pdo->query("SHOW TABLES LIKE 'inventory_movements'")->fetch();
    if (!$checkMovements) {
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

    // 4. Insertar líneas y descontar stock y generar movimientos de inventario
    foreach ($products as $item) {
        $pId = intval($item['productId']);
        $qty = intval($item['qty']);
        $price = floatval($item['price']);

        // Insertar línea de factura
        $lineStmt = $pdo->prepare('
            INSERT INTO invoice_items (invoice_id, product_id, qty, price)
            VALUES (:invoice_id, :product_id, :qty, :price)
        ');
        $lineStmt->execute([
            'invoice_id' => $invoiceId,
            'product_id' => $pId,
            'qty' => $qty,
            'price' => $price
        ]);

        // Descontar stock
        $updStockStmt = $pdo->prepare('
            UPDATE products 
            SET stock = stock - :qty
            WHERE id = :id
        ');
        $updStockStmt->execute([
            'qty' => $qty,
            'id' => $pId
        ]);

        // Registrar movimiento de Kardex (Salida)
        $movStmt = $pdo->prepare('
            INSERT INTO inventory_movements (custom_id, product_id, qty, type, reason, date, user_id)
            VALUES ("TEMP", :product_id, :qty, "Salida", :reason, :date, :user_id)
        ');
        $movStmt->execute([
            'product_id' => $pId,
            'qty' => -$qty,
            'reason' => "Venta Facturada $invNum",
            'date' => $date,
            'user_id' => $userId
        ]);

        $newMovId = $pdo->lastInsertId();
        $customMovId = 'MOV-' . (500 + $newMovId);

        $updateMovStmt = $pdo->prepare('UPDATE inventory_movements SET custom_id = :custom_id WHERE id = :id');
        $updateMovStmt->execute([
            'custom_id' => $customMovId,
            'id' => $newMovId
        ]);
    }

    // Actualizar totales de la sesión de caja activa
    if (strtolower($paymentMethod) === 'efectivo') {
        $updCash = $pdo->prepare('
            UPDATE cash_sessions 
            SET cash_sales = cash_sales + :total,
                expected_cash = expected_cash + :total
            WHERE id = :id
        ');
        $updCash->execute([
            'total' => $total,
            'id' => $cashSessionId
        ]);
    } else if (strtolower($paymentMethod) === 'tarjeta') {
        $updCash = $pdo->prepare('
            UPDATE cash_sessions 
            SET card_sales = card_sales + :total
            WHERE id = :id
        ');
        $updCash->execute([
            'total' => $total,
            'id' => $cashSessionId
        ]);
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => "Factura $invNum emitida con éxito.",
        'invoice' => [
            'id' => $invoiceId,
            'customId' => $customId,
            'invoiceNumber' => $invNum,
            'clientId' => $clientId,
            'date' => $date,
            'products' => $products,
            'subtotal' => $subtotal,
            'taxRate' => $taxRate,
            'taxAmount' => $taxAmount,
            'discount' => $discount,
            'total' => $total,
            'status' => $status,
            'paymentMethod' => $paymentMethod
        ]
    ]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
