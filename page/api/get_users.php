<?php
// ============================================================
// OBTENER LISTA DE USUARIOS (GET) — ANAYA ERP
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

try {
    // Obtener todos los usuarios exceptuando el hash de contraseña
    $stmt = $pdo->query('SELECT id, name, email, role, created_at FROM users ORDER BY id DESC');
    $users = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'users' => $users
    ]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al obtener los usuarios: ' . $e->getMessage()]);
}
?>
