<?php
// ============================================================
// PROCESAR O CANCELAR PEDIDO WEB (POST) — ANAYA ERP
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

$webOrderId = isset($input['webOrderId']) ? intval($input['webOrderId']) : 0;
$action = isset($input['action']) ? trim($input['action']) : ''; // 'Confirmar' o 'Cancelar'

if ($webOrderId <= 0 || !in_array($action, ['Confirmar', 'Cancelar'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Parámetros inválidos. Se requiere ID de pedido y acción (Confirmar/Cancelar).']);
    exit;
}

try {
    // 1. Si la acción es Cancelar, simplemente cambiamos el estado
    if ($action === 'Cancelar') {
        $pdo->beginTransaction();
        
        $stmt = $pdo->prepare('UPDATE web_orders SET status = "Cancelado" WHERE id = :id AND status = "Pendiente"');
        $stmt->execute(['id' => $webOrderId]);
        
        if ($stmt->rowCount() === 0) {
            throw new Exception("El pedido web no existe o ya no está en estado Pendiente.");
        }
        
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'El pedido web ha sido cancelado.']);
        exit;
    }

    // 2. Si es Confirmar, procedemos a facturar y descontar stock
    $pdo->beginTransaction();

    // 2.1 Obtener la sesión de caja activa
    $stmtCash = $pdo->prepare('SELECT id, custom_id FROM cash_sessions WHERE status = "Abierta" LIMIT 1 FOR UPDATE');
    $stmtCash->execute();
    $activeCash = $stmtCash->fetch();
    
    if (!$activeCash) {
        throw new Exception("Para confirmar y facturar un pedido, debe haber una sesión de caja abierta activa.");
    }
    $cashSessionId = intval($activeCash['id']);

    // 2.2 Obtener la cabecera del pedido web
    $stmtOrder = $pdo->prepare('SELECT * FROM web_orders WHERE id = :id AND status = "Pendiente" FOR UPDATE');
    $stmtOrder->execute(['id' => $webOrderId]);
    $order = $stmtOrder->fetch();

    if (!$order) {
        throw new Exception("El pedido web no existe, ya fue procesado o está cancelado.");
    }

    // 2.3 Obtener los ítems del pedido web
    $stmtItems = $pdo->prepare('SELECT * FROM web_order_items WHERE web_order_id = :web_order_id');
    $stmtItems->execute(['web_order_id' => $webOrderId]);
    $orderItems = $stmtItems->fetchAll();

    if (empty($orderItems)) {
        throw new Exception("El pedido web no contiene ningún artículo.");
    }

    // 2.4 Verificar stock suficiente para todos los artículos
    foreach ($orderItems as $item) {
        $pId = intval($item['product_id']);
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

    // 2.5 Resolver el Cliente en la base de datos (Buscar por DNI o crear)
    $clientStmt = $pdo->prepare('SELECT id FROM clients WHERE document = :document LIMIT 1');
    $clientStmt->execute(['document' => $order['client_document']]);
    $client = $clientStmt->fetch();

    if ($client) {
        $clientId = intval($client['id']);
        // Actualizar dirección/teléfono
        $updClient = $pdo->prepare('UPDATE clients SET name = :name, phone = :phone, email = :email, address = :address, city = :city WHERE id = :id');
        $updClient->execute([
            'name' => $order['client_name'],
            'phone' => $order['client_phone'],
            'email' => $order['client_email'],
            'address' => $order['client_address'],
            'city' => $order['client_city'],
            'id' => $clientId
        ]);
    } else {
        // Registrar nuevo cliente en el ERP
        $insertClient = $pdo->prepare('
            INSERT INTO clients (custom_id, name, document, phone, email, address, city) 
            VALUES ("TEMP", :name, :document, :phone, :email, :address, :city)
        ');
        $insertClient->execute([
            'name' => $order['client_name'],
            'document' => $order['client_document'],
            'phone' => $order['client_phone'],
            'email' => $order['client_email'],
            'address' => $order['client_address'],
            'city' => $order['client_city']
        ]);

        $clientId = $pdo->lastInsertId();
        $customClientId = 'CLI-' . (300 + $clientId);

        $updateClientCode = $pdo->prepare('UPDATE clients SET custom_id = :custom_id WHERE id = :id');
        $updateClientCode->execute([
            'custom_id' => $customClientId,
            'id' => $clientId
        ]);
    }

    // 2.6 Generar numeración de factura
    $stmtInvoiceCount = $pdo->query('SELECT COALESCE(MAX(id), 0) AS max_id FROM invoices');
    $maxInvoiceId = intval($stmtInvoiceCount->fetch()['max_id']);
    $nextInvoiceId = $maxInvoiceId + 1;
    
    $invNum = 'FACT-2026-' . str_pad($nextInvoiceId, 3, '0', STR_PAD_LEFT);
    $customInvoiceId = 'INV-' . (400 + $nextInvoiceId);
    $userId = isset($_SESSION['userId']) ? intval($_SESSION['userId']) : 1;
    $date = date('Y-m-d');

    // Desglose fiscal de total
    $settingsStmt = $pdo->query('SELECT tax_rate FROM settings LIMIT 1');
    $settings = $settingsStmt->fetch();
    $taxRate = $settings ? intval($settings['tax_rate']) : 21;
    
    $totalVal = floatval($order['total']);
    $baseImponible = $totalVal / (1 + ($taxRate / 100));
    $taxAmount = $totalVal - $baseImponible;

    // 2.7 Insertar cabecera de factura
    $invoiceStmt = $pdo->prepare('
        INSERT INTO invoices (custom_id, invoice_number, client_id, user_id, date, subtotal, tax_rate, tax_amount, discount, total, status, payment_method)
        VALUES (:custom_id, :invoice_number, :client_id, :user_id, :date, :subtotal, :tax_rate, :tax_amount, 0.00, :total, "Cobrada", "Pedido Web")
    ');
    $invoiceStmt->execute([
        'custom_id' => $customInvoiceId,
        'invoice_number' => $invNum,
        'client_id' => $clientId,
        'user_id' => $userId,
        'date' => $date,
        'subtotal' => round($baseImponible, 2),
        'tax_rate' => $taxRate,
        'tax_amount' => round($taxAmount, 2),
        'total' => round($totalVal, 2)
    ]);
    $invoiceId = $pdo->lastInsertId();

    // 2.8 Insertar ítems de la factura, reducir stock y registrar Kardex
    foreach ($orderItems as $item) {
        $pId = intval($item['product_id']);
        $qty = intval($item['qty']);
        $price = floatval($item['price']);

        // Línea de factura
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

        // Obtener stock mínimo
        $stmtMin = $pdo->prepare('SELECT min_stock, stock FROM products WHERE id = :id');
        $stmtMin->execute(['id' => $pId]);
        $prodData = $stmtMin->fetch();
        $minStock = intval($prodData['min_stock']);
        $newStock = intval($prodData['stock']) - $qty;

        $newStatus = 'Disponible';
        if ($newStock === 0) {
            $newStatus = 'Agotado';
        } elseif ($newStock <= $minStock) {
            $newStatus = 'Bajo Stock';
        }

        // Actualizar Stock
        $updStockStmt = $pdo->prepare('
            UPDATE products 
            SET stock = :stock, status = :status
            WHERE id = :id
        ');
        $updStockStmt->execute([
            'stock' => $newStock,
            'status' => $newStatus,
            'id' => $pId
        ]);

        // Registrar movimiento de Salida (Kardex)
        $movStmt = $pdo->prepare('
            INSERT INTO inventory_movements (custom_id, product_id, qty, type, reason, date, user_id)
            VALUES ("TEMP", :product_id, :qty, "Salida", :reason, :date, :user_id)
        ');
        $movStmt->execute([
            'product_id' => $pId,
            'qty' => -$qty,
            'reason' => "Venta Pedido Web {$order['order_number']}",
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

    // 2.9 Afectar las ventas por tarjeta en la sesión de caja activa (para arqueo de caja)
    $updCash = $pdo->prepare('
        UPDATE cash_sessions 
        SET card_sales = card_sales + :total
        WHERE id = :id
    ');
    $updCash->execute([
        'total' => $totalVal,
        'id' => $cashSessionId
    ]);

    // 2.10 Cambiar estado del pedido web a Procesado
    $updWebOrder = $pdo->prepare('UPDATE web_orders SET status = "Procesado" WHERE id = :id');
    $updWebOrder->execute(['id' => $webOrderId]);

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => "Pedido web {$order['order_number']} procesado correctamente. Emitida factura $invNum."
    ]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
