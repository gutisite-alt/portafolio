<?php
// ============================================================
// OBTENER SESIÓN DE CAJA ACTIVA (GET) — ANAYA ERP
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
    // Buscar la sesión abierta
    $stmt = $pdo->prepare('
        SELECT s.*, UNIX_TIMESTAMP(s.opening_date) AS opening_date_unix, u.name AS user_name 
        FROM cash_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.status = "Abierta" 
        LIMIT 1
    ');
    $stmt->execute();
    $session = $stmt->fetch();

    if ($session) {
        $sessionId = intval($session['id']);
        
        $expectedCash = floatval($session['initial_base']) + floatval($session['cash_sales']) + floatval($session['cash_inflows']) - floatval($session['cash_outflows']);
        
        $movsStmt = $pdo->prepare('
            SELECT m.*, u.name AS user_name 
            FROM cash_movements m
            JOIN users u ON m.user_id = u.id
            WHERE m.cash_session_id = :session_id 
            ORDER BY m.id DESC
        ');
        $movsStmt->execute(['session_id' => $sessionId]);
        $movements = $movsStmt->fetchAll();

        echo json_encode([
            'success' => true,
            'active' => true,
            'session' => [
                'id' => $session['id'],
                'customId' => $session['custom_id'],
                'userId' => $session['user_id'],
                'userName' => $session['user_name'],
                'status' => $session['status'],
                'openingDate' => $session['opening_date_unix'] ? gmdate('Y-m-d\TH:i:s\Z', $session['opening_date_unix']) : null,
                'initialBase' => floatval($session['initial_base']),
                'cashSales' => floatval($session['cash_sales']),
                'cardSales' => floatval($session['card_sales']),
                'cashInflows' => floatval($session['cash_inflows']),
                'cashOutflows' => floatval($session['cash_outflows']),
                'expectedCash' => $expectedCash,
                'movements' => $movements
            ]
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'active' => false
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al consultar la sesión de caja: ' . $e->getMessage()]);
}
?>
