<?php
// ============================================================
// REGISTRAR MOVIMIENTO MANUAL DE CAJA CHICA (POST) — ANAYA ERP
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

$type = isset($input['type']) ? trim($input['type']) : '';
$amount = isset($input['amount']) ? floatval($input['amount']) : 0.00;
$reason = isset($input['reason']) ? trim($input['reason']) : '';
$createdAt = isset($input['createdAt']) ? trim($input['createdAt']) : date('Y-m-d H:i:s');

if (!in_array($type, ['Entrada', 'Salida']) || $amount <= 0 || empty($reason)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Parámetros obligatorios incompletos o incorrectos. El importe debe ser mayor que 0.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. Obtener la sesión de caja abierta activa
    $stmtSession = $pdo->prepare('SELECT id, custom_id, expected_cash FROM cash_sessions WHERE status = "Abierta" LIMIT 1 FOR UPDATE');
    $stmtSession->execute();
    $session = $stmtSession->fetch();

    if (!$session) {
        throw new Exception("No existe ninguna sesión de caja abierta para registrar movimientos.");
    }

    $sessionId = intval($session['id']);
    $userId = intval($_SESSION['userId']);

    // 2. Insertar movimiento de caja chica
    $insMov = $pdo->prepare('
        INSERT INTO cash_movements (cash_session_id, user_id, type, amount, reason, created_at)
        VALUES (:cash_session_id, :user_id, :type, :amount, :reason, :created_at)
    ');
    $insMov->execute([
        'cash_session_id' => $sessionId,
        'user_id' => $userId,
        'type' => $type,
        'amount' => $amount,
        'reason' => $reason,
        'created_at' => $createdAt
    ]);

    // 3. Actualizar totales de la sesión de caja
    if ($type === 'Entrada') {
        $updSession = $pdo->prepare('
            UPDATE cash_sessions 
            SET cash_inflows = cash_inflows + :amount, 
                expected_cash = expected_cash + :amount 
            WHERE id = :id
        ');
    } else { // Salida
        $updSession = $pdo->prepare('
            UPDATE cash_sessions 
            SET cash_outflows = cash_outflows + :amount, 
                expected_cash = expected_cash - :amount 
            WHERE id = :id
        ');
    }
    $updSession->execute([
        'amount' => $amount,
        'id' => $sessionId
    ]);

    $pdo->commit();

    // Registrar en auditoría
    write_audit_log($pdo, 'CASH_MOVE', 'cash_movements', $sessionId, "Se registró un movimiento manual de tipo '$type' por valor de $amount € en la caja {$session['custom_id']}. Motivo: '$reason'.");

    echo json_encode([
        'success' => true,
        'message' => "Movimiento de $type registrado con éxito."
    ]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
