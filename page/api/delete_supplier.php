<?php
// ============================================================
// ELIMINAR PROVEEDOR (POST) — ANAYA ERP
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
    echo json_encode(['success' => false, 'message' => 'ID de proveedor inválido.']);
    exit;
}

try {
    $stmt = $pdo->prepare('DELETE FROM suppliers WHERE id = :id');
    $stmt->execute(['id' => $id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Proveedor eliminado exitosamente de la base de datos.'
    ]);
} catch (\PDOException $e) {
    // Si hay un error de violación de integridad referencial (ej: clave foránea)
    if ($e->getCode() == '23000') {
        http_response_code(409);
        echo json_encode([
            'success' => false, 
            'message' => 'No es posible eliminar este proveedor debido a que existen órdenes de compra o productos vinculados a su ficha.'
        ]);
        exit;
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al eliminar el proveedor: ' . $e->getMessage()]);
}
?>
