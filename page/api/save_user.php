<?php
// ============================================================
// REGISTRAR O ACTUALIZAR USUARIO (POST) — ANAYA ERP
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

// Leer el payload JSON enviado desde JS
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

$id = isset($input['id']) ? intval($input['id']) : 0;
$name = isset($input['name']) ? trim($input['name']) : '';
$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? trim($input['password']) : '';
$role = isset($input['role']) ? trim($input['role']) : 'operator';

// Validaciones básicas
if (empty($name) || empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El Nombre y Correo Electrónico son obligatorios.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El formato del correo electrónico es inválido.']);
    exit;
}

// Si es nuevo usuario, la contraseña es obligatoria y debe tener >= 6 caracteres
if ($id <= 0 && empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'La contraseña es obligatoria para un usuario nuevo.']);
    exit;
}

if (!empty($password) && strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres.']);
    exit;
}

try {
    if ($id > 0) {
        // Validar si el correo electrónico ya existe para otro usuario
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email AND id != :id LIMIT 1');
        $stmt->execute(['email' => $email, 'id' => $id]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'El correo electrónico ya se encuentra registrado para otro usuario.']);
            exit;
        }

        // Si se especificó contraseña, la actualizamos
        if (!empty($password)) {
            $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare('UPDATE users SET name = :name, email = :email, password = :password, role = :role WHERE id = :id');
            $stmt->execute([
                'name' => $name,
                'email' => $email,
                'password' => $hashedPassword,
                'role' => $role,
                'id' => $id
            ]);
        } else {
            // Si no, dejamos la contraseña anterior
            $stmt = $pdo->prepare('UPDATE users SET name = :name, email = :email, role = :role WHERE id = :id');
            $stmt->execute([
                'name' => $name,
                'email' => $email,
                'role' => $role,
                'id' => $id
            ]);
        }

        // Si el usuario se está editando a sí mismo, actualizamos su sesión local
        if ($id === intval($_SESSION['userId'])) {
            $_SESSION['userName'] = $name;
            $_SESSION['role'] = $role;
        }

        write_audit_log($pdo, 'USER_UPDATE', 'users', $id, "Se actualizó el usuario: '$name' ($email), rol: '$role'.");
        
        echo json_encode([
            'success' => true,
            'message' => 'Usuario actualizado correctamente.'
        ]);
    } else {
        // Validar si el correo electrónico ya existe
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'El correo electrónico ya se encuentra registrado.']);
            exit;
        }

        // Hashear la contraseña con Bcrypt
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

        // Insertar el nuevo registro en la tabla de usuarios
        $stmt = $pdo->prepare('INSERT INTO users (name, email, password, role) VALUES (:name, :email, :password, :role)');
        $stmt->execute([
            'name' => $name,
            'email' => $email,
            'password' => $hashedPassword,
            'role' => $role
        ]);

        $newUserId = $pdo->lastInsertId();
        write_audit_log($pdo, 'USER_CREATE', 'users', $newUserId, "Se creó un nuevo usuario: '$name' ($email) con el rol de '$role'.");

        echo json_encode([
            'success' => true,
            'message' => 'Usuario registrado exitosamente.'
        ]);
    }
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error en la base de datos al guardar el usuario: ' . $e->getMessage()]);
}
?>
