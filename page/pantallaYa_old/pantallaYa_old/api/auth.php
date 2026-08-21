<?php
require_once 'db.php';

// Obtener datos enviados en formato JSON
$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $_GET['action'] ?? $input['action'] ?? '';

// Estructura de respuesta por defecto
$response = ['success' => false, 'message' => 'Acción no válida'];

switch ($action) {
    case 'register':
        $nombre = trim($input['nombre'] ?? '');
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';

        if (empty($nombre) || empty($email) || empty($password)) {
            $response['message'] = 'Todos los campos son obligatorios';
            break;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $response['message'] = 'Formato de correo inválido';
            break;
        }

        try {
            // Verificar si el usuario ya existe
            $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                $response['message'] = 'El correo electrónico ya está registrado';
                break;
            }

            // Insertar el nuevo usuario con password hash seguro
            $passwordHash = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)");
            $stmt->execute([$nombre, $email, $passwordHash]);
            $userId = $pdo->lastInsertId();

            // Guardar datos en la sesión PHP
            $_SESSION['user_id'] = $userId;
            $_SESSION['user_name'] = $nombre;
            $_SESSION['user_email'] = $email;
            $_SESSION['user_role'] = 'cliente';

            $response = [
                'success' => true,
                'message' => 'Usuario registrado exitosamente',
                'user' => [
                    'id' => $userId,
                    'nombre' => $nombre,
                    'email' => $email,
                    'rol' => 'cliente'
                ]
            ];
        } catch (PDOException $e) {
            $response['message'] = 'Error al registrar el usuario: ' . $e->getMessage();
        }
        break;

    case 'login':
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';

        if (empty($email) || empty($password)) {
            $response['message'] = 'Correo y contraseña son obligatorios';
            break;
        }

        try {
            $stmt = $pdo->prepare("SELECT id, nombre, email, password_hash, rol FROM usuarios WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password_hash'])) {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_name'] = $user['nombre'];
                $_SESSION['user_email'] = $user['email'];
                $_SESSION['user_role'] = $user['rol'];

                $response = [
                    'success' => true,
                    'message' => 'Sesión iniciada correctamente',
                    'user' => [
                        'id' => $user['id'],
                        'nombre' => $user['nombre'],
                        'email' => $user['email'],
                        'rol' => $user['rol']
                    ]
                ];
            } else {
                $response['message'] = 'Correo o contraseña incorrectos';
            }
        } catch (PDOException $e) {
            $response['message'] = 'Error al iniciar sesión: ' . $e->getMessage();
        }
        break;

    case 'status':
        if (isset($_SESSION['user_id'])) {
            $response = [
                'success' => true,
                'loggedIn' => true,
                'user' => [
                    'id' => $_SESSION['user_id'],
                    'nombre' => $_SESSION['user_name'],
                    'email' => $_SESSION['user_email'],
                    'rol' => $_SESSION['user_role']
                ]
            ];
        } else {
            $response = [
                'success' => true,
                'loggedIn' => false,
                'message' => 'Usuario no autenticado'
            ];
        }
        break;

    case 'logout':
        session_unset();
        session_destroy();
        $response = [
            'success' => true,
            'message' => 'Sesión cerrada correctamente'
        ];
        break;
}

echo json_encode($response);
exit;
