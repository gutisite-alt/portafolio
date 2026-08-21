<?php
// ============================================================
// CERRAR Y ARQUEAR SESIÓN DE CAJA (POST) — ANAYA ERP
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

$realCash = isset($input['realCash']) ? floatval($input['realCash']) : 0.00;
$notes = isset($input['notes']) ? trim($input['notes']) : '';
$closingDate = gmdate('Y-m-d H:i:s');

if ($realCash < 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El saldo contado no puede ser un valor negativo.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. Obtener la sesión de caja abierta activa
    $stmtSession = $pdo->prepare('SELECT * FROM cash_sessions WHERE status = "Abierta" LIMIT 1 FOR UPDATE');
    $stmtSession->execute();
    $session = $stmtSession->fetch();

    if (!$session) {
        throw new Exception("No existe ninguna sesión de caja activa abierta para realizar el arqueo.");
    }

    $sessionId = intval($session['id']);
    
    // Recalcular saldo esperado
    $expectedCash = floatval($session['initial_base']) + floatval($session['cash_sales']) + floatval($session['cash_inflows']) - floatval($session['cash_outflows']);
    $difference = $realCash - $expectedCash;

    // 2. Cerrar la sesión
    $upd = $pdo->prepare('
        UPDATE cash_sessions 
        SET status = "Cerrada", 
            closing_date = :closing_date, 
            real_cash = :real_cash, 
            difference = :difference, 
            expected_cash = :expected_cash,
            notes = :notes 
        WHERE id = :id
    ');
    $upd->execute([
        'closing_date' => $closingDate,
        'real_cash' => $realCash,
        'difference' => $difference,
        'expected_cash' => $expectedCash,
        'notes' => $notes,
        'id' => $sessionId
    ]);

    $pdo->commit();

    // Registrar en auditoría
    write_audit_log($pdo, 'CASH_CLOSE', 'cash_sessions', $sessionId, "Se arqueó y cerró la sesión de caja {$session['custom_id']}. Esperado: $expectedCash €, Contado: $realCash €, Diferencia: $difference €. Notas: '$notes'.");

    if (floatval($difference) != 0.00) {
        $discrepancyType = $difference < 0 ? 'FALTANTE' : 'SOBRANTE';
        write_audit_log($pdo, 'CASH_DISCREPANCY', 'cash_sessions', $sessionId, "¡DESVIACIÓN DETECTADA! Se registró un descuadre ($discrepancyType) de $difference € al cerrar la caja {$session['custom_id']}.");
    }

    echo json_encode([
        'success' => true,
        'message' => "Caja cerrada y arqueada con éxito. Diferencia final: $difference €."
    ]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
