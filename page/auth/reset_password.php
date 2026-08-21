<?php
// ============================================================
// RESTABLECIMIENTO EFECTIVO DE CONTRASEÑA (POST) — ANAYA OUTLET
// ============================================================

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido. Se requiere POST.']);
    exit;
}

require_once '../config/db_connect.php';

$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

$email = isset($input['email']) ? trim($input['email']) : '';
$token = isset($input['token']) ? trim($input['token']) : '';
$password = isset($input['password']) ? trim($input['password']) : '';

if (empty($email) || empty($token) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El correo electrónico, el token de autorización y la nueva contraseña son requeridos.']);
    exit;
}

if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'La nueva contraseña debe tener al menos 6 caracteres.']);
    exit;
}

try {
    // Buscar el usuario por email
    $stmt = $pdo->prepare('SELECT id, reset_token, reset_expires FROM users WHERE email = :email LIMIT 1');
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado.']);
        exit;
    }

    // Verificar si el token coincide y no está vacío
    if (empty($user['reset_token']) || $user['reset_token'] !== $token) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Acceso denegado. El token de autorización es inválido o ya ha sido utilizado.']);
        exit;
    }

    // Verificar si el token de sesión temporal ha expirado
    $now = date('Y-m-d H:i:s');
    if ($user['reset_expires'] < $now) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'La sesión de recuperación ha expirado. Solicite un nuevo código.']);
        exit;
    }

    // Hashear la contraseña con el algoritmo seguro de PHP (Bcrypt)
    $passwordHash = password_hash($password, PASSWORD_BCRYPT);

    // Actualizar la contraseña del usuario y limpiar los campos de recuperación
    $updateStmt = $pdo->prepare('UPDATE users SET password = :password, reset_token = NULL, reset_expires = NULL WHERE id = :id');
    $updateStmt->execute([
        'password' => $passwordHash,
        'id' => $user['id']
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Contraseña actualizada con éxito. Ingrese con su nueva clave.'
    ]);
    exit;

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al restablecer: ' . $e->getMessage()]);
    exit;
}
?>
