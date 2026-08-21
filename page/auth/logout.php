<?php
// ============================================================
// CIERRE DE SESIÓN (POST/GET) — ANAYA ERP
// ============================================================

// Habilitar sesiones
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');

// Vaciar todas las variables de sesión
$_SESSION = array();

// Si se desea destruir la cookie de sesión por seguridad, se limpia también
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Destruir la sesión en el servidor
session_destroy();

echo json_encode([
    'success' => true,
    'message' => 'La sesión ha sido destruida correctamente.'
]);
?>
