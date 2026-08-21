<?php
// ============================================================
// ACTUALIZAR PERFIL DEL USUARIO LOGUEADO (POST) — ANAYA ERP
// ============================================================

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');

// Verificar sesión activa
if (!isset($_SESSION['loggedIn']) || $_SESSION['loggedIn'] !== true || !isset($_SESSION['userId'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Sesión no iniciada. Acceso denegado.']);
    exit;
}

// Permitir solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido. Se requiere POST.']);
    exit;
}

require_once '../config/db_connect.php';

// Leer el payload JSON
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

$userId = intval($_SESSION['userId']);
$name = isset($input['name']) ? trim($input['name']) : '';
$email = isset($input['email']) ? trim($input['email']) : '';
$phone = isset($input['phone']) ? trim($input['phone']) : '';
$password = isset($input['password']) ? trim($input['password']) : '';

// Validaciones básicas
if (empty($name) || empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El Nombre y el Correo Electrónico son obligatorios.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El formato del correo electrónico es inválido.']);
    exit;
}

if (!empty($password) && strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'La nueva contraseña debe tener al menos 6 caracteres.']);
    exit;
}

try {
    // Validar si el correo electrónico ya existe para otro usuario
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email AND id != :id LIMIT 1');
    $stmt->execute(['email' => $email, 'id' => $userId]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'El correo electrónico ya se encuentra registrado para otro usuario.']);
        exit;
    }

    if (!empty($password)) {
        // Hashear nueva contraseña
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare('UPDATE users SET name = :name, email = :email, phone = :phone, password = :password WHERE id = :id');
        $stmt->execute([
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'password' => $hashedPassword,
            'id' => $userId
        ]);
    } else {
        // Dejar contraseña anterior intacta
        $stmt = $pdo->prepare('UPDATE users SET name = :name, email = :email, phone = :phone WHERE id = :id');
        $stmt->execute([
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'id' => $userId
        ]);
    }

    // Actualizar variables de sesión local para reflejar los cambios de inmediato
    $_SESSION['userName'] = $name;

    write_audit_log($pdo, 'PROFILE_UPDATE', 'users', $userId, "El usuario actualizó su propio perfil: '$name' ($email).");

    echo json_encode([
        'success' => true,
        'message' => 'Tu perfil ha sido actualizado correctamente.'
    ]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error en la base de datos al actualizar el perfil: ' . $e->getMessage()]);
}
?>
