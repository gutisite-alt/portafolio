<?php
// ============================================================
// DEVOLVER FACTURA (POST) — ANAYA ERP
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

if ($_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado. Las devoluciones de facturas requieren privilegios de Administrador.']);
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

$invoiceId = isset($input['id']) ? intval($input['id']) : 0;

if ($invoiceId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de factura inválido.']);
    exit;
}

try {
    // 1. Asegurar preventivamente la columna en el ENUM por si no se ha regenerado
    $pdo->exec("ALTER TABLE invoices MODIFY COLUMN status ENUM('Cobrada', 'Pendiente', 'Devuelta') NOT NULL DEFAULT 'Pendiente'");

    $pdo->beginTransaction();

    // 2. Obtener factura
    $stmt = $pdo->prepare('SELECT id, status, invoice_number, total, payment_method FROM invoices WHERE id = :id FOR UPDATE');
    $stmt->execute(['id' => $invoiceId]);
    $invoice = $stmt->fetch();

    if (!$invoice) {
        throw new Exception("La factura con ID $invoiceId no existe.");
    }

    $status = $invoice['status'];
    $invoiceNumber = $invoice['invoice_number'];
    $totalRefunded = floatval($invoice['total']);
    $paymentMethod = $invoice['payment_method'];

    if ($status === 'Devuelta') {
        throw new Exception("Esta factura ya ha sido devuelta.");
    }

    // Solo se permite devolver facturas cobradas
    if ($status !== 'Cobrada') {
        throw new Exception("Solo se pueden realizar devoluciones sobre facturas cobradas.");
    }

    // 3. Obtener líneas de factura
    $itemsStmt = $pdo->prepare('SELECT product_id, qty, price FROM invoice_items WHERE invoice_id = :invoice_id');
    $itemsStmt->execute(['invoice_id' => $invoiceId]);
    $items = $itemsStmt->fetchAll();

    $userId = isset($_SESSION['userId']) ? intval($_SESSION['userId']) : 1;
    $date = date('Y-m-d');

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

    // Asegurarse de que la tabla de devoluciones existe (Self-healing)
    $checkReturns = $pdo->query("SHOW TABLES LIKE 'returns'")->fetch();
    if (!$checkReturns) {
        $createReturnsSQL = "CREATE TABLE IF NOT EXISTS returns (
            id INT AUTO_INCREMENT PRIMARY KEY,
            custom_id VARCHAR(20) NOT NULL UNIQUE,
            invoice_id INT NOT NULL,
            user_id INT NOT NULL,
            date DATE NOT NULL,
            reason VARCHAR(255) NOT NULL,
            total_refunded DECIMAL(10,2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
        $pdo->exec($createReturnsSQL);
    }

    // 4. Devolver stock e insertar entradas de Kardex
    foreach ($items as $item) {
        $productId = intval($item['product_id']);
        $qty = intval($item['qty']);

        // Bloqueo de concurrencia para obtener datos frescos y prevenir condiciones de carrera en el stock
        $lockProd = $pdo->prepare('SELECT id, stock, min_stock FROM products WHERE id = :id FOR UPDATE');
        $lockProd->execute(['id' => $productId]);
        $prodRow = $lockProd->fetch();

        if ($prodRow) {
            $newStock = intval($prodRow['stock']) + $qty;
            $minStock = intval($prodRow['min_stock']);
            $newStatus = 'Disponible';
            if ($newStock === 0) {
                $newStatus = 'Agotado';
            } elseif ($newStock <= $minStock) {
                $newStatus = 'Bajo Stock';
            }

            // Incrementar stock y actualizar estado del producto
            $updStockStmt = $pdo->prepare('UPDATE products SET stock = :stock, status = :status WHERE id = :id');
            $updStockStmt->execute([
                'stock' => $newStock,
                'status' => $newStatus,
                'id' => $productId
            ]);
        }

        // Registrar movimiento de Entrada en Kardex (cantidad positiva)
        $movStmt = $pdo->prepare('
            INSERT INTO inventory_movements (custom_id, product_id, qty, type, reason, date, user_id)
            VALUES ("TEMP", :product_id, :qty, "Entrada", :reason, :date, :user_id)
        ');
        $movStmt->execute([
            'product_id' => $productId,
            'qty' => $qty,
            'reason' => "Devolución Factura $invoiceNumber",
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

    // 5. Marcar factura como 'Devuelta'
    $updInvoiceStmt = $pdo->prepare('UPDATE invoices SET status = "Devuelta" WHERE id = :id');
    $updInvoiceStmt->execute(['id' => $invoiceId]);

    // 6. Generar identificador de devolución y registrar en tabla de devoluciones
    $stmtMax = $pdo->query('SELECT COALESCE(MAX(id), 0) AS max_id FROM returns');
    $maxReturnId = intval($stmtMax->fetchColumn());
    $nextReturnId = $maxReturnId + 1;
    $customReturnId = 'RET-' . (100 + $nextReturnId);

    $insertReturnStmt = $pdo->prepare('
        INSERT INTO returns (custom_id, invoice_id, user_id, date, reason, total_refunded)
        VALUES (:custom_id, :invoice_id, :user_id, :date, :reason, :total_refunded)
    ');
    $insertReturnStmt->execute([
        'custom_id' => $customReturnId,
        'invoice_id' => $invoiceId,
        'user_id' => $userId,
        'date' => $date,
        'reason' => "Devolución completa de factura $invoiceNumber",
        'total_refunded' => $totalRefunded
    ]);

    // Registrar devolución en la sesión de caja activa si corresponde
    $stmtCash = $pdo->prepare('SELECT id, custom_id FROM cash_sessions WHERE status = "Abierta" LIMIT 1 FOR UPDATE');
    $stmtCash->execute();
    $activeCash = $stmtCash->fetch();
    
    if ($activeCash && strtolower($paymentMethod) === 'efectivo') {
        $cashSessionId = intval($activeCash['id']);
        
        // Sumar al total de salidas y restar del efectivo esperado
        $updCash = $pdo->prepare('
            UPDATE cash_sessions 
            SET cash_outflows = cash_outflows + :total,
                expected_cash = expected_cash - :total
            WHERE id = :id
        ');
        $updCash->execute([
            'total' => $totalRefunded,
            'id' => $cashSessionId
        ]);
        
        // Registrar movimiento de salida en el historial de caja
        $insMov = $pdo->prepare('
            INSERT INTO cash_movements (cash_session_id, user_id, type, amount, reason)
            VALUES (:cash_session_id, :user_id, "Salida", :amount, :reason)
        ');
        $insMov->execute([
            'cash_session_id' => $cashSessionId,
            'user_id' => $userId,
            'amount' => $totalRefunded,
            'reason' => "Reembolso en efectivo por Devolución de Factura $invoiceNumber"
        ]);
    }

    $pdo->commit();

    // Registrar Auditoría de Devolución
    write_audit_log($pdo, 'INVOICE_RETURN', 'invoices', $invoiceId, "Se procesó la devolución total de la factura $invoiceNumber (Código Devolución: $customReturnId) por un valor reembolsado de $totalRefunded €.");

    echo json_encode([
        'success' => true,
        'message' => "Devolución de factura $invoiceNumber procesada con éxito y registrada bajo el código $customReturnId. Stock restablecido.",
        'invoiceId' => $invoiceId
    ]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
