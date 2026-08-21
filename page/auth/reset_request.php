<?php
// ============================================================
// SOLICITUD DE RECUPERACIÓN DE CONTRASEÑA (POST) — ANAYA OUTLET
// ============================================================

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido. Se requiere POST.']);
    exit;
}

require_once '../config/db_connect.php';

// --- MIGRACIÓN AUTOSANABLE DE BASE DE DATOS (HOT UPGRADE) ---
try {
    // 1. Columnas para la tabla 'users'
    $columnsToRepairUsers = [
        'phone' => "VARCHAR(30) NULL DEFAULT '+34 600 123 456'",
        'reset_token' => "VARCHAR(255) NULL",
        'reset_expires' => "DATETIME NULL"
    ];

    foreach ($columnsToRepairUsers as $colName => $colDef) {
        $checkCol = $pdo->query("SHOW COLUMNS FROM `users` LIKE '$colName'")->fetch();
        if (!$checkCol) {
            $pdo->exec("ALTER TABLE `users` ADD COLUMN `$colName` $colDef");
        }
    }

    // Asegurar que el administrador por defecto tiene un teléfono válido
    $checkAdminPhone = $pdo->prepare("SELECT phone FROM users WHERE email = :email LIMIT 1");
    $checkAdminPhone->execute(['email' => 'admin@anayaoutlet.com']);
    $adminRow = $checkAdminPhone->fetch();
    if ($adminRow && (empty($adminRow['phone']) || $adminRow['phone'] === '+34 600 123 456')) {
        $pdo->exec("UPDATE users SET phone = '+34 600 123 456' WHERE email = 'admin@anayaoutlet.com' AND (phone IS NULL OR phone = '')");
    }

    // 2. Columnas para la tabla 'settings'
    $columnsToRepairSettings = [
        'twilio_sid' => "VARCHAR(100) NULL",
        'twilio_auth_token' => "VARCHAR(100) NULL",
        'twilio_phone' => "VARCHAR(30) NULL"
    ];

    foreach ($columnsToRepairSettings as $colName => $colDef) {
        $checkCol = $pdo->query("SHOW COLUMNS FROM `settings` LIKE '$colName'")->fetch();
        if (!$checkCol) {
            $pdo->exec("ALTER TABLE `settings` ADD COLUMN `$colName` $colDef");
        }
    }
} catch (\PDOException $e) {
    // Si la migración falla pero las columnas ya existen por parche manual, continuamos.
}

// --- PROCESAR SOLICITUD ---
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);
$email = isset($input['email']) ? trim($input['email']) : '';

if (empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El correo electrónico es requerido.']);
    exit;
}

try {
    // 1. Buscar usuario
    $stmt = $pdo->prepare('SELECT id, name, email, phone FROM users WHERE email = :email LIMIT 1');
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'El correo electrónico no se encuentra registrado en el sistema.']);
        exit;
    }

    // 2. Generar código de 6 dígitos
    $code = strval(rand(100000, 999999));
    $expires = date('Y-m-d H:i:s', strtotime('+10 minutes'));

    // Guardar código y expiración en la BD
    $updateStmt = $pdo->prepare('UPDATE users SET reset_token = :code, reset_expires = :expires WHERE id = :id');
    $updateStmt->execute([
        'code' => $code,
        'expires' => $expires,
        'id' => $user['id']
    ]);

    // 3. Obtener credenciales de Twilio
    $settingsStmt = $pdo->query('SELECT twilio_sid, twilio_auth_token, twilio_phone FROM settings LIMIT 1');
    $settings = $settingsStmt->fetch();

    $twilioSid = !empty($settings['twilio_sid']) ? trim($settings['twilio_sid']) : '';
    $twilioAuthToken = !empty($settings['twilio_auth_token']) ? trim($settings['twilio_auth_token']) : '';
    $twilioPhone = !empty($settings['twilio_phone']) ? trim($settings['twilio_phone']) : '';

    $smsSentReal = false;
    $smsErrorMsg = '';

    // Enmascarar teléfono para visualización segura en la interfaz (ej: +34 ******456)
    $rawPhone = !empty($user['phone']) ? $user['phone'] : '+34 600 123 456';
    $maskedPhone = $rawPhone;
    if (strlen($rawPhone) > 7) {
        $prefix = substr($rawPhone, 0, 4);
        $suffix = substr($rawPhone, -3);
        $maskedPhone = $prefix . " ****** " . $suffix;
    }

    $smsMessage = "Su codigo de recuperacion de ANAYA OUTLET es: $code. Expira en 10 minutos.";

    // 4. Intentar envío de SMS real si hay credenciales configuradas
    if (!empty($twilioSid) && !empty($twilioAuthToken) && !empty($twilioPhone)) {
        $twilioUrl = "https://api.twilio.com/2010-04-01/Accounts/$twilioSid/Messages.json";
        
        $postData = [
            'To' => $rawPhone,
            'From' => $twilioPhone,
            'Body' => $smsMessage
        ];

        $ch = curl_init($twilioUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
        curl_setopt($ch, CURLOPT_USERPWD, "$twilioSid:$twilioAuthToken");
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        
        // Desactivar temporalmente verificación SSL si falla en hostings específicos (ej: InfinityFree)
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 300) {
            $smsSentReal = true;
        } else {
            $responseDecoded = json_decode($response, true);
            $smsErrorMsg = isset($responseDecoded['message']) ? $responseDecoded['message'] : 'Error en la llamada a la API de Twilio (HTTP ' . $httpCode . ')';
        }
    }

    // 5. Retornar respuesta
    if ($smsSentReal) {
        echo json_encode([
            'success' => true,
            'message' => 'Código de recuperación enviado por SMS real.',
            'mode' => 'real',
            'phone' => $maskedPhone
        ]);
    } else {
        // Modo simulado / fallback
        echo json_encode([
            'success' => true,
            'message' => 'Código generado. Configure Twilio para envíos reales.',
            'mode' => 'simulated',
            'phone' => $maskedPhone,
            'simulated_code' => $code, // El frontend usará esto para el widget del simulador
            'simulated_message' => $smsMessage,
            'twilio_error' => !empty($smsErrorMsg) ? $smsErrorMsg : null
        ]);
    }
    exit;

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos: ' . $e->getMessage()]);
    exit;
}
?>
