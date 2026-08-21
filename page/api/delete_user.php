<?php
// ============================================================
// ELIMINAR USUARIO (POST) — ANAYA ERP
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

require_once '../config/db_connect.php';

// Leer el payload JSON enviado desde JS
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

$userId = isset($input['userId']) ? intval($input['userId']) : 0;

if ($userId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de usuario inválido.']);
    exit;
}

// Medida de seguridad: impedir que el usuario se elimine a sí mismo
if ($userId === intval($_SESSION['userId'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No puedes eliminar tu propia cuenta mientras mantienes una sesión abierta.']);
    exit;
}

try {
    // Obtener datos del usuario antes de borrar
    $stmtUser = $pdo->prepare('SELECT name, email FROM users WHERE id = :id LIMIT 1');
    $stmtUser->execute(['id' => $userId]);
    $userRow = $stmtUser->fetch();
    $name = $userRow ? $userRow['name'] : 'Desconocido';
    $email = $userRow ? $userRow['email'] : 'Desconocido';

    // Eliminar registro
    $stmt = $pdo->prepare('DELETE FROM users WHERE id = :id');
    $stmt->execute(['id' => $userId]);

    write_audit_log($pdo, 'USER_DELETE', 'users', $userId, "Se eliminó al usuario '$name' ($email) del ERP.");

    echo json_encode([
        'success' => true,
        'message' => 'Usuario eliminado exitosamente de la base de datos.'
    ]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al eliminar el usuario de la base de datos: ' . $e->getMessage()]);
}
?>
