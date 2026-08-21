<?php
// ============================================================
// VERIFICACIÓN DEL CÓDIGO SMS (POST) — ANAYA OUTLET
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
$code = isset($input['code']) ? trim($input['code']) : '';

if (empty($email) || empty($code)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El correo electrónico y el código son requeridos.']);
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

    // Verificar si el token/código está vacío o no coincide
    if (empty($user['reset_token']) || $user['reset_token'] !== $code) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'El código de verificación ingresado es incorrecto.']);
        exit;
    }

    // Verificar si el código ha expirado
    $now = date('Y-m-d H:i:s');
    if ($user['reset_expires'] < $now) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'El código de verificación ha expirado. Solicite uno nuevo.']);
        exit;
    }

    // Generar un token temporal seguro de sesión única para la fase de cambio de contraseña
    $tempToken = bin2hex(random_bytes(32));
    $tempExpires = date('Y-m-d H:i:s', strtotime('+5 minutes')); // 5 minutos de validez para cambiar la clave

    // Actualizar la base de datos con el token temporal de autorización
    $updateStmt = $pdo->prepare('UPDATE users SET reset_token = :token, reset_expires = :expires WHERE id = :id');
    $updateStmt->execute([
        'token' => $tempToken,
        'expires' => $tempExpires,
        'id' => $user['id']
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Código verificado con éxito. Procede a cambiar tu contraseña.',
        'token' => $tempToken
    ]);
    exit;

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos: ' . $e->getMessage()]);
    exit;
}
?>
