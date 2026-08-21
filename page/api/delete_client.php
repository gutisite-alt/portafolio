<?php
// ============================================================
// ELIMINAR CLIENTE (POST) — ANAYA ERP
// ============================================================

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');

// Verificar sesión activa y rol de administrador
if (!isset($_SESSION['loggedIn']) || $_SESSION['loggedIn'] !== true || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado. Permisos de administrador requeridos.']);
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

$id = isset($input['id']) ? intval($input['id']) : 0;

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de cliente inválido.']);
    exit;
}

try {
    $stmt = $pdo->prepare('DELETE FROM clients WHERE id = :id');
    $stmt->execute(['id' => $id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Cliente eliminado exitosamente del CRM.'
    ]);
} catch (\PDOException $e) {
    // Si hay un error de violación de integridad referencial (ej: clave foránea con invoices)
    if ($e->getCode() == '23000') {
        http_response_code(409);
        echo json_encode([
            'success' => false, 
            'message' => 'No es posible eliminar este cliente debido a que posee facturas o registros de venta asociados en el sistema.'
        ]);
        exit;
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al eliminar el cliente: ' . $e->getMessage()]);
}
?>
