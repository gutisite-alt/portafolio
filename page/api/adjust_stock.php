<?php
// ============================================================
// AJUSTAR STOCK MANUALMENTE (POST) — ANAYA ERP
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

$productId = isset($input['productId']) ? intval($input['productId']) : 0;
$qty = isset($input['qty']) ? intval($input['qty']) : 0;
$type = isset($input['type']) ? trim($input['type']) : 'Ajuste';
$reason = isset($input['reason']) ? trim($input['reason']) : '';

if ($productId <= 0 || empty($reason) || !in_array($type, ['Entrada', 'Salida', 'Ajuste'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Parámetros obligatorios faltantes o incorrectos.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Obtener stock actual
    $stmt = $pdo->prepare('SELECT name, stock, min_stock FROM products WHERE id = :id FOR UPDATE');
    $stmt->execute(['id' => $productId]);
    $prod = $stmt->fetch();

    if (!$prod) {
        throw new Exception("El producto seleccionado no existe en el catálogo.");
    }

    $oldStock = intval($prod['stock']);
    $newStock = $oldStock + $qty;
    if ($newStock < 0) {
        $newStock = 0; // Evitar stock negativo físico
    }

    // Determinar nuevo estado
    $minStock = intval($prod['min_stock']);
    $status = 'Disponible';
    if ($newStock === 0) {
        $status = 'Agotado';
    } elseif ($newStock <= $minStock) {
        $status = 'Bajo Stock';
    }

    // Actualizar producto
    $upd = $pdo->prepare('UPDATE products SET stock = :stock, status = :status WHERE id = :id');
    $upd->execute([
        'stock' => $newStock,
        'status' => $status,
        'id' => $productId
    ]);

    // Registrar en Kardex
    $userId = isset($_SESSION['userId']) ? intval($_SESSION['userId']) : 1;
    $date = date('Y-m-d');

    $movStmt = $pdo->prepare('
        INSERT INTO inventory_movements (custom_id, product_id, qty, type, reason, date, user_id)
        VALUES ("TEMP", :product_id, :qty, :type, :reason, :date, :user_id)
    ');
    $movStmt->execute([
        'product_id' => $productId,
        'qty' => $qty,
        'type' => $type,
        'reason' => $reason,
        'date' => $date,
        'user_id' => $userId
    ]);

    $newMovId = $pdo->lastInsertId();
    $customMovId = 'MOV-' . (500 + $newMovId);

    $updMov = $pdo->prepare('UPDATE inventory_movements SET custom_id = :custom_id WHERE id = :id');
    $updMov->execute([
        'custom_id' => $customMovId,
        'id' => $newMovId
    ]);

    $pdo->commit();

    // Registrar Auditoría de Ajuste de Stock
    write_audit_log($pdo, 'STOCK_ADJUST', 'products', $productId, "Ajuste de inventario manual para '{$prod['name']}' (ID $productId). Stock: $oldStock -> $newStock (Ajuste: $qty, Tipo: '$type', Motivo: '$reason').");

    echo json_encode([
        'success' => true,
        'message' => "Stock ajustado de $oldStock a $newStock para '{$prod['name']}' correctamente.",
        'newStock' => $newStock,
        'status' => $status
    ]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
