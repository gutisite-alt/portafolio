<?php
// ============================================================
// REGISTRAR O ACTUALIZAR PROVEEDOR (POST) — ANAYA ERP
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
    echo json_encode(['success' => false, 'message' => 'Acceso denegado. Solo los administradores pueden crear o modificar proveedores.']);
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
$contact = isset($input['contact']) ? trim($input['contact']) : '';
$phone = isset($input['phone']) ? trim($input['phone']) : '';
$status = isset($input['status']) ? trim($input['status']) : 'Activo';
$email = isset($input['email']) ? trim($input['email']) : '';
$address = isset($input['address']) ? trim($input['address']) : '';

if (empty($name) || empty($contact) || empty($phone) || empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Los campos de Empresa, Contacto, Teléfono y Correo Electrónico son obligatorios.']);
    exit;
}

try {
    if ($id > 0) {
        // Actualizar proveedor existente
        $stmt = $pdo->prepare('UPDATE suppliers SET name = :name, contact = :contact, phone = :phone, status = :status, email = :email, address = :address WHERE id = :id');
        $stmt->execute([
            'name' => $name,
            'contact' => $contact,
            'phone' => $phone,
            'status' => $status,
            'email' => $email,
            'address' => $address,
            'id' => $id
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Ficha de proveedor actualizada con éxito.']);
    } else {
        // Registrar nuevo proveedor
        $pdo->beginTransaction();
        
        $stmt = $pdo->prepare('INSERT INTO suppliers (custom_id, name, contact, phone, status, email, address) VALUES ("TEMP", :name, :contact, :phone, :status, :email, :address)');
        $stmt->execute([
            'name' => $name,
            'contact' => $contact,
            'phone' => $phone,
            'status' => $status,
            'email' => $email,
            'address' => $address
        ]);
        
        $newId = $pdo->lastInsertId();
        $customId = 'SUP-' . (100 + $newId);
        
        $updateStmt = $pdo->prepare('UPDATE suppliers SET custom_id = :custom_id WHERE id = :id');
        $updateStmt->execute([
            'custom_id' => $customId,
            'id' => $newId
        ]);
        
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Proveedor registrado con éxito en el catálogo.']);
    }
} catch (\PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al guardar el proveedor: ' . $e->getMessage()]);
}
?>
