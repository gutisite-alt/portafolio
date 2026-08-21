<?php
// ============================================================
// OBTENER CONFIGURACIÓN DE LA EMPRESA (GET) — ANAYA ERP
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

require_once '../config/db_connect.php';

try {
    // Intentar consultar la configuración
    $stmt = $pdo->prepare('SELECT * FROM settings WHERE id = 1 LIMIT 1');
    $stmt->execute();
    $settings = $stmt->fetch();

    if (!$settings) {
        // Si no se lanzó excepción pero retornó vacío, insertamos la fila por defecto
        $pdo->exec("INSERT INTO settings (id, company_name, cif, phone, email, address, city, state, tax_rate, currency, twilio_sid, twilio_auth_token, twilio_phone) 
                    VALUES (1, 'Anaya Outlet S.L.', 'B-87654321', '+34 910 123 456', 'contacto@anayaoutlet.com', 'Calle Mayor 124, Polígono Industrial Oeste', 'Madrid', 'Madrid', 21, '€', NULL, NULL, NULL)
                    ON DUPLICATE KEY UPDATE id=id");
        
        $stmt->execute();
        $settings = $stmt->fetch();
    }

    echo json_encode([
        'success' => true,
        'settings' => $settings
    ]);
} catch (\PDOException $e) {
    // Si el error es "tabla no existe" (SQLSTATE[42S02] o error 1146), creamos la tabla automáticamente
    if ($e->getCode() == '42S02' || strpos($e->getMessage(), '1146') !== false) {
        try {
            $createTableSQL = "CREATE TABLE IF NOT EXISTS settings (
                id INT PRIMARY KEY DEFAULT 1,
                company_name VARCHAR(150) NOT NULL DEFAULT 'Anaya Outlet S.L.',
                cif VARCHAR(30) NOT NULL DEFAULT 'B-87654321',
                phone VARCHAR(30) NULL,
                email VARCHAR(100) NULL,
                address VARCHAR(255) NULL,
                city VARCHAR(100) NULL,
                state VARCHAR(100) NULL,
                tax_rate INT NOT NULL DEFAULT 21,
                currency VARCHAR(10) NOT NULL DEFAULT '€',
                twilio_sid VARCHAR(100) NULL,
                twilio_auth_token VARCHAR(100) NULL,
                twilio_phone VARCHAR(30) NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT chk_single_row CHECK (id = 1)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
            
            $pdo->exec($createTableSQL);
            
            // Insertar fila inicial
            $pdo->exec("INSERT INTO settings (id, company_name, cif, phone, email, address, city, state, tax_rate, currency, twilio_sid, twilio_auth_token, twilio_phone) 
                        VALUES (1, 'Anaya Outlet S.L.', 'B-87654321', '+34 910 123 456', 'contacto@anayaoutlet.com', 'Calle Mayor 124, Polígono Industrial Oeste', 'Madrid', 'Madrid', 21, '€', NULL, NULL, NULL)");
            
            // Consultar de nuevo
            $stmt = $pdo->prepare('SELECT * FROM settings WHERE id = 1 LIMIT 1');
            $stmt->execute();
            $settings = $stmt->fetch();
            
            echo json_encode([
                'success' => true,
                'settings' => $settings
            ]);
            exit;
        } catch (\PDOException $ex) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al crear tabla settings: ' . $ex->getMessage()]);
            exit;
        }
    }
    
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al obtener configuración: ' . $e->getMessage()]);
}
?>
