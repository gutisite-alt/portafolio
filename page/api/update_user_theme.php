<?php
// ============================================================
// ACTUALIZAR TEMA PREFERIDO DEL USUARIO (POST) — ANAYA ERP
// ============================================================

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');

// Verificar sesión activa
if (!isset($_SESSION['loggedIn']) || $_SESSION['loggedIn'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado. Inicie sesión.']);
    exit;
}

// Permitir solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido. Se requiere POST.']);
    exit;
}

require_once '../config/db_connect.php';

$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

$theme = isset($input['theme']) ? trim($input['theme']) : '';

if (empty($theme) || !in_array($theme, ['light', 'dark', 'system'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Tema inválido o no soportado.']);
    exit;
}

$userId = intval($_SESSION['userId']);

try {
    // Actualizar tema en la base de datos
    $stmt = $pdo->prepare('UPDATE users SET theme = :theme WHERE id = :id');
    $stmt->execute([
        'theme' => $theme,
        'id' => $userId
    ]);

    // Actualizar la variable de sesión
    $_SESSION['theme'] = $theme;

    // Registrar en auditoría
    write_audit_log($pdo, 'THEME_UPDATE', 'users', $userId, "El usuario actualizó su preferencia de tema visual a '$theme'.");

    echo json_encode([
        'success' => true,
        'message' => 'Preferencia de tema actualizada correctamente.',
        'theme' => $theme
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al guardar la preferencia en el servidor: ' . $e->getMessage()]);
}
?>
