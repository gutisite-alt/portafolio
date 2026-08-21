<?php
// ============================================================
// ACTUALIZAR ESTADO DE FACTURA (POST) — ANAYA ERP
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

$invoiceId = isset($input['id']) ? intval($input['id']) : 0;
$newStatus = isset($input['status']) ? trim($input['status']) : '';

if ($invoiceId <= 0 || !in_array($newStatus, ['Cobrada', 'Pendiente'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Parámetros inválidos para actualizar la factura.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Obtener la factura actual para validar
    $stmt = $pdo->prepare('SELECT id, status, invoice_number FROM invoices WHERE id = :id FOR UPDATE');
    $stmt->execute(['id' => $invoiceId]);
    $invoice = $stmt->fetch();

    if (!$invoice) {
        throw new Exception("La factura con ID $invoiceId no existe.");
    }

    $oldStatus = $invoice['status'];
    $invoiceNumber = $invoice['invoice_number'];

    if ($oldStatus === 'Cobrada') {
        throw new Exception("Esta factura ya ha sido cobrada anteriormente.");
    }

    // Actualizar estado de la factura
    $updStmt = $pdo->prepare('UPDATE invoices SET status = :status WHERE id = :id');
    $updStmt->execute(['status' => $newStatus, 'id' => $invoiceId]);

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => "La factura $invoiceNumber ha sido marcada como '$newStatus' con éxito."
    ]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
