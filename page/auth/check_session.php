<?php
// ============================================================
// VERIFICADOR DE SESIÓN ACTIVA (GET) — ANAYA ERP
// ============================================================

// Habilitar sesiones
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');

// Verificar si las variables de sesión requeridas están establecidas
if (isset($_SESSION['loggedIn']) && $_SESSION['loggedIn'] === true && isset($_SESSION['userId'])) {
    require_once '../config/db_connect.php';
    try {
        $stmt = $pdo->prepare('SELECT id, name, email, phone, role, theme FROM users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $_SESSION['userId']]);
        $user = $stmt->fetch();
        
        if ($user) {
            // Actualizar variables de sesión con información en tiempo real
            $_SESSION['name'] = $user['name'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['role'] = $user['role'];
            $_SESSION['theme'] = $user['theme'] ? $user['theme'] : 'light';

            echo json_encode([
                'success' => true,
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
        }
    } catch (\PDOException $e) {
        // Fallback si hay un error de conexión, usar los datos cacheados de sesión
    }

    echo json_encode([
        'success' => true,
        'user' => [
            'id' => intval($_SESSION['userId']),
            'name' => $_SESSION['name'],
            'email' => $_SESSION['email'],
            'phone' => '',
            'role' => $_SESSION['role'],
            'theme' => isset($_SESSION['theme']) ? $_SESSION['theme'] : 'light'
        ]
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'No existe ninguna sesión activa en el servidor.'
    ]);
}
?>
