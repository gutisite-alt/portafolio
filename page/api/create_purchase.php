<?php
// ============================================================
// REGISTRAR ÓRDEN DE COMPRA (POST) — ANAYA ERP
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

$supplierId = isset($input['supplierId']) ? intval($input['supplierId']) : 0;
$total = isset($input['total']) ? floatval($input['total']) : 0.00;
$products = isset($input['products']) ? $input['products'] : [];

if ($supplierId <= 0 || empty($products)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Debe asociar un proveedor y añadir referencias al pedido.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Generar código único y custom_id
    $stmt = $pdo->query('SELECT COALESCE(MAX(id), 0) AS max_id FROM purchase_orders');
    $maxId = intval($stmt->fetch()['max_id']);
    $nextId = $maxId + 1;
    $poCode = 'OC-2026-' . str_pad($nextId, 3, '0', STR_PAD_LEFT);
    $customId = 'PUR-' . (600 + $nextId);
    $userId = isset($_SESSION['userId']) ? intval($_SESSION['userId']) : 1;
    $date = date('Y-m-d');

    // Insertar cabecera de la órden de compra
    $stmt = $pdo->prepare('
        INSERT INTO purchase_orders (custom_id, po_number, supplier_id, user_id, date, total, status)
        VALUES (:custom_id, :po_number, :supplier_id, :user_id, :date, :total, "Pendiente")
    ');
    $stmt->execute([
        'custom_id' => $customId,
        'po_number' => $poCode,
        'supplier_id' => $supplierId,
        'user_id' => $userId,
        'date' => $date,
        'total' => $total
    ]);

    $poId = $pdo->lastInsertId();

    // Insertar líneas de la órden
    foreach ($products as $item) {
        $pId = intval($item['productId']);
        $qty = intval($item['qty']);
        $cost = floatval($item['cost']);

        $lineStmt = $pdo->prepare('
            INSERT INTO purchase_order_items (purchase_order_id, product_id, qty, cost)
            VALUES (:purchase_order_id, :product_id, :qty, :cost)
        ');
        $lineStmt->execute([
            'purchase_order_id' => $poId,
            'product_id' => $pId,
            'qty' => $qty,
            'cost' => $cost
        ]);
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => "Órden de compra $poCode registrada con éxito.",
        'purchaseOrder' => [
            'id' => $poId,
            'customId' => $customId,
            'poNumber' => $poCode,
            'supplierId' => $supplierId,
            'date' => $date,
            'total' => $total,
            'status' => 'Pendiente',
            'products' => $products
        ]
    ]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al registrar órden de compra: ' . $e->getMessage()]);
}
?>
