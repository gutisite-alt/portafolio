<?php
// ============================================================
// REGISTRAR AUDITORÍA DE EXPORTACIÓN PDF (GET) — ANAYA ERP
// ============================================================

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');

// Verificar sesión activa
if (!isset($_SESSION['loggedIn']) || $_SESSION['loggedIn'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

require_once '../config/db_connect.php';

$invNum = isset($_GET['invNum']) ? trim($_GET['invNum']) : '';

if (!empty($invNum)) {
    // Buscar ID de la factura
    $stmt = $pdo->prepare('SELECT id FROM invoices WHERE invoice_number = :num LIMIT 1');
    $stmt->execute(['num' => $invNum]);
    $invId = $stmt->fetchColumn();
    
    write_audit_log(
        $pdo, 
        'INVOICE_PDF_EXPORT', 
        'invoices', 
        $invId ? intval($invId) : null, 
        "Se exportó y descargó el documento PDF de la factura $invNum."
    );
}

echo json_encode(['success' => true]);
?>
