<?php
// ============================================================
// ENDPOINT DE INICIO DE SESIÓN (POST) — ANAYA ERP
// ============================================================

// Habilitar sesiones
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');

// Solo permitir peticiones POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido. Se requiere POST.']);
    exit;
}

// Cargar la conexión de base de datos
require_once '../config/db_connect.php';

// Leer el payload JSON enviado desde JS
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? trim($input['password']) : '';

// Validaciones básicas de campos vacíos
if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El correo y la contraseña son requeridos.']);
    exit;
}

try {
    // Buscar el usuario por email
    $stmt = $pdo->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();

    // Validar usuario y verificar contraseña con hash bcrypt seguro
    if ($user && password_verify($password, $user['password'])) {
        // Almacenar información del usuario en la sesión de PHP
        $_SESSION['loggedIn'] = true;
        $_SESSION['userId'] = $user['id'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['name'] = $user['name'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['theme'] = isset($user['theme']) ? $user['theme'] : 'light';

        // Respuesta exitosa
        echo json_encode([
            'success' => true,
            'message' => 'Autenticación correcta. Acceso concedido.',
            'user' => [
                'id' => intval($user['id']),
                'name' => $user['name'],
                'email' => $user['email'],
                'phone' => $user['phone'] ? $user['phone'] : '',
                'role' => $user['role'],
                'theme' => $_SESSION['theme']
            ]
        ]);
        exit;
    } else {
        // Credenciales incorrectas
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Correo electrónico o contraseña incorrectos.']);
        exit;
    }
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor en la consulta: ' . $e->getMessage()]);
    exit;
}
?>
