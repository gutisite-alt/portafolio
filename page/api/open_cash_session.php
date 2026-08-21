<?php
// ============================================================
// ABRIR SESIÓN DE CAJA (POST) — ANAYA ERP
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

$initialBase = isset($input['initialBase']) ? floatval($input['initialBase']) : 0.00;
$openingDate = gmdate('Y-m-d H:i:s');

if ($initialBase < 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'La base inicial no puede ser negativa.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. Verificar si ya existe una caja abierta
    $stmtCheck = $pdo->query('SELECT id FROM cash_sessions WHERE status = "Abierta" LIMIT 1');
    if ($stmtCheck->fetch()) {
        throw new Exception("Ya existe una sesión de caja abierta. Debe cerrarla antes de abrir una nueva.");
    }

    // 2. Generar código correlativo de caja
    $stmtMax = $pdo->query('SELECT COALESCE(MAX(id), 0) AS max_id FROM cash_sessions');
    $maxId = intval($stmtMax->fetch()['max_id']);
    $nextId = $maxId + 1;
    $customId = 'CSH-' . (600 + $nextId);
    $userId = intval($_SESSION['userId']);

    // 3. Insertar sesión de caja
    $ins = $pdo->prepare('
        INSERT INTO cash_sessions (custom_id, user_id, status, initial_base, expected_cash, cash_sales, card_sales, cash_inflows, cash_outflows, opening_date)
        VALUES (:custom_id, :user_id, "Abierta", :initial_base, :expected_cash, 0, 0, 0, 0, :opening_date)
    ');
    $ins->execute([
        'custom_id' => $customId,
        'user_id' => $userId,
        'initial_base' => $initialBase,
        'expected_cash' => $initialBase,
        'opening_date' => $openingDate
    ]);

    $sessionId = $pdo->lastInsertId();

    $pdo->commit();

    // Registrar en auditoría
    write_audit_log($pdo, 'CASH_OPEN', 'cash_sessions', $sessionId, "Se abrió la sesión de caja '$customId' con un fondo inicial de $initialBase €.");

    echo json_encode([
        'success' => true,
        'message' => "Caja $customId abierta correctamente.",
        'session' => [
            'id' => $sessionId,
            'customId' => $customId,
            'initialBase' => $initialBase,
            'status' => 'Abierta'
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
