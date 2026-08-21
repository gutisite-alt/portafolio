<?php
// ============================================================
// REGISTRAR O ACTUALIZAR CLIENTE (POST) — ANAYA ERP
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
    echo json_encode(['success' => false, 'message' => 'Acceso denegado. Solo los administradores pueden registrar o modificar clientes.']);
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
$document = isset($input['document']) ? trim($input['document']) : '';
$phone = isset($input['phone']) ? trim($input['phone']) : '';
$email = isset($input['email']) ? trim($input['email']) : '';
$address = isset($input['address']) ? trim($input['address']) : '';
$city = isset($input['city']) ? trim($input['city']) : '';

if (empty($name) || empty($document) || empty($phone) || empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Los campos de Nombre, Documento (CIF/NIF), Teléfono y Correo Electrónico son obligatorios.']);
    exit;
}

try {
    if ($id > 0) {
        // Validar que el documento no sea duplicado por otro cliente
        $stmt = $pdo->prepare('SELECT id FROM clients WHERE document = :document AND id != :id LIMIT 1');
        $stmt->execute(['document' => $document, 'id' => $id]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'El documento fiscal ya se encuentra registrado para otro cliente.']);
            exit;
        }

        // Actualizar cliente
        $stmt = $pdo->prepare('UPDATE clients SET name = :name, document = :document, phone = :phone, email = :email, address = :address, city = :city WHERE id = :id');
        $stmt->execute([
            'name' => $name,
            'document' => $document,
            'phone' => $phone,
            'email' => $email,
            'address' => $address,
            'city' => $city,
            'id' => $id
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Ficha de cliente actualizada con éxito.']);
    } else {
        // Validar documento duplicado
        $stmt = $pdo->prepare('SELECT id FROM clients WHERE document = :document LIMIT 1');
        $stmt->execute(['document' => $document]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'El documento fiscal ya se encuentra registrado en el sistema.']);
            exit;
        }

        // Registrar nuevo cliente
        $pdo->beginTransaction();
        
        $stmt = $pdo->prepare('INSERT INTO clients (custom_id, name, document, phone, email, address, city) VALUES ("TEMP", :name, :document, :phone, :email, :address, :city)');
        $stmt->execute([
            'name' => $name,
            'document' => $document,
            'phone' => $phone,
            'email' => $email,
            'address' => $address,
            'city' => $city
        ]);
        
        $newId = $pdo->lastInsertId();
        $customId = 'CLI-' . (300 + $newId);
        
        $updateStmt = $pdo->prepare('UPDATE clients SET custom_id = :custom_id WHERE id = :id');
        $updateStmt->execute([
            'custom_id' => $customId,
            'id' => $newId
        ]);
        
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Cliente añadido con éxito al CRM.']);
    }
} catch (\PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error en la base de datos al guardar el cliente: ' . $e->getMessage()]);
}
?>
