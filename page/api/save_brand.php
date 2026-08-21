<?php
// ============================================================
// AGREGAR/EDITAR MARCA (POST) — ANAYA ERP
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
    echo json_encode(['success' => false, 'message' => 'Acceso denegado. Solo los administradores pueden crear o modificar marcas.']);
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
    echo json_encode(['success' => false, 'message' => 'El nombre de la marca es obligatorio.']);
    exit;
}

try {
    if ($id > 0) {
        // Verificar si la marca ya existe con otro ID
        $stmt = $pdo->prepare('SELECT id FROM brands WHERE name = :name AND id != :id LIMIT 1');
        $stmt->execute(['name' => $name, 'id' => $id]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'El nombre de marca ya se encuentra registrado.']);
            exit;
        }

        // Actualizar marca
        $stmt = $pdo->prepare('UPDATE brands SET name = :name WHERE id = :id');
        $stmt->execute(['name' => $name, 'id' => $id]);

        echo json_encode([
            'success' => true,
            'message' => 'Marca actualizada exitosamente.'
        ]);
    } else {
        // Verificar si la marca ya existe
        $stmt = $pdo->prepare('SELECT id FROM brands WHERE name = :name LIMIT 1');
        $stmt->execute(['name' => $name]);
        if ($stmt->fetch()) {
            echo json_encode(['success' => true, 'message' => 'La marca ya se encuentra registrada.']);
            exit;
        }

        // Insertar nueva marca
        $stmt = $pdo->prepare('INSERT INTO brands (name) VALUES (:name)');
        $stmt->execute(['name' => $name]);

        echo json_encode([
            'success' => true,
            'message' => 'Marca registrada exitosamente.'
        ]);
    }

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al guardar la marca: ' . $e->getMessage()]);
}
?>
