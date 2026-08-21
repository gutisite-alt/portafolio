<?php
// ============================================================
// AGREGAR CATEGORÍA (POST) — ANAYA ERP
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

if ($_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado. Solo los administradores pueden crear o modificar categorías.']);
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

$id = isset($input['id']) ? intval($input['id']) : 0;
$name = isset($input['name']) ? trim($input['name']) : '';

if (empty($name)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El nombre de la categoría es obligatorio.']);
    exit;
}

try {
    if ($id > 0) {
        // Verificar si la categoría ya existe con otro ID
        $stmt = $pdo->prepare('SELECT id FROM categories WHERE name = :name AND id != :id LIMIT 1');
        $stmt->execute(['name' => $name, 'id' => $id]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'El nombre de categoría ya se encuentra registrado.']);
            exit;
        }

        // Actualizar categoría
        $stmt = $pdo->prepare('UPDATE categories SET name = :name WHERE id = :id');
        $stmt->execute(['name' => $name, 'id' => $id]);

        echo json_encode([
            'success' => true,
            'message' => 'Categoría actualizada exitosamente.'
        ]);
    } else {
        // Verificar si la categoría ya existe
        $stmt = $pdo->prepare('SELECT id FROM categories WHERE name = :name LIMIT 1');
        $stmt->execute(['name' => $name]);
        if ($stmt->fetch()) {
            echo json_encode(['success' => true, 'message' => 'La categoría ya se encuentra registrada.']);
            exit;
        }

        // Insertar nueva categoría
        $stmt = $pdo->prepare('INSERT INTO categories (name) VALUES (:name)');
        $stmt->execute(['name' => $name]);

        echo json_encode([
            'success' => true,
            'message' => 'Categoría registrada exitosamente.'
        ]);
    }

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al guardar la categoría: ' . $e->getMessage()]);
}
?>
