<?php
// ============================================================
// GUARDAR CONFIGURACIÓN DE LA EMPRESA (POST) — ANAYA ERP
// ============================================================

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');

// Verificar sesión activa y privilegios de administrador
if (!isset($_SESSION['loggedIn']) || $_SESSION['loggedIn'] !== true || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado. Se requieren permisos de administrador.']);
    exit;
}

// Permitir solo peticiones POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido. Se requiere POST.']);
    exit;
}

require_once '../config/db_connect.php';

// Leer el payload JSON enviado desde JS
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

$companyName = isset($input['companyName']) ? trim($input['companyName']) : '';
$cif = isset($input['cif']) ? trim($input['cif']) : '';
$taxRate = isset($input['taxRate']) ? intval($input['taxRate']) : 21;
$phone = isset($input['phone']) ? trim($input['phone']) : null;
$email = isset($input['email']) ? trim($input['email']) : null;
$address = isset($input['address']) ? trim($input['address']) : null;
$city = isset($input['city']) ? trim($input['city']) : null;
$state = isset($input['state']) ? trim($input['state']) : null;
$twilioSid = isset($input['twilioSid']) ? trim($input['twilioSid']) : null;
$twilioAuthToken = isset($input['twilioAuthToken']) ? trim($input['twilioAuthToken']) : null;
$twilioPhone = isset($input['twilioPhone']) ? trim($input['twilioPhone']) : null;

if (empty($companyName) || empty($cif)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El nombre de la empresa y el identificador fiscal (CIF/NIF) son obligatorios.']);
    exit;
}

try {
    // Obtener configuración previa para auditar
    $stmtOld = $pdo->query('SELECT * FROM settings WHERE id = 1 LIMIT 1');
    $oldSettings = $stmtOld->fetch();

    // Actualizar o insertar fila de configuración (única fila con id=1)
    $stmt = $pdo->prepare('
        INSERT INTO settings (id, company_name, cif, phone, email, address, city, state, tax_rate, twilio_sid, twilio_auth_token, twilio_phone)
        VALUES (1, :name, :cif, :phone, :email, :address, :city, :state, :tax_rate, :twilio_sid, :twilio_auth_token, :twilio_phone)
        ON DUPLICATE KEY UPDATE 
            company_name = VALUES(company_name),
            cif = VALUES(cif),
            phone = VALUES(phone),
            email = VALUES(email),
            address = VALUES(address),
            city = VALUES(city),
            state = VALUES(state),
            tax_rate = VALUES(tax_rate),
            twilio_sid = VALUES(twilio_sid),
            twilio_auth_token = VALUES(twilio_auth_token),
            twilio_phone = VALUES(twilio_phone)
    ');
    
    $stmt->execute([
        'name' => $companyName,
        'cif' => $cif,
        'phone' => $phone,
        'email' => $email,
        'address' => $address,
        'city' => $city,
        'state' => $state,
        'tax_rate' => $taxRate,
        'twilio_sid' => $twilioSid,
        'twilio_auth_token' => $twilioAuthToken,
        'twilio_phone' => $twilioPhone
    ]);

    // Registrar Auditoría
    if ($oldSettings) {
        $changes = [];
        if ($oldSettings['company_name'] !== $companyName) $changes[] = "Empresa: '{$oldSettings['company_name']}' -> '$companyName'";
        if ($oldSettings['cif'] !== $cif) $changes[] = "CIF: '{$oldSettings['cif']}' -> '$cif'";
        if (intval($oldSettings['tax_rate']) !== $taxRate) $changes[] = "IVA: {$oldSettings['tax_rate']}% -> $taxRate%";
        if ($oldSettings['phone'] !== $phone) $changes[] = "Teléfono: '{$oldSettings['phone']}' -> '$phone'";
        if ($oldSettings['email'] !== $email) $changes[] = "Email: '{$oldSettings['email']}' -> '$email'";
        if ($oldSettings['address'] !== $address) $changes[] = "Dirección: '{$oldSettings['address']}' -> '$address'";
        if ($oldSettings['city'] !== $city) $changes[] = "Ciudad: '{$oldSettings['city']}' -> '$city'";
        if ($oldSettings['twilio_sid'] !== $twilioSid) $changes[] = "Twilio SID actualizado";
        if ($oldSettings['twilio_auth_token'] !== $twilioAuthToken) $changes[] = "Twilio Auth Token actualizado";

        $desc = "Se actualizó la configuración general del ERP.";
        if (!empty($changes)) {
            $desc .= " Cambios realizados: " . implode(', ', $changes);
        } else {
            $desc .= " Sin cambios en los valores principales.";
        }
        write_audit_log($pdo, 'SETTINGS_UPDATE', 'settings', 1, $desc);
    } else {
        write_audit_log($pdo, 'SETTINGS_CREATE', 'settings', 1, "Se inicializó la configuración general de la empresa con nombre '$companyName'.");
    }

    echo json_encode([
        'success' => true,
        'message' => 'Configuración de la empresa guardada con éxito.'
    ]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al guardar la configuración: ' . $e->getMessage()]);
}
?>
