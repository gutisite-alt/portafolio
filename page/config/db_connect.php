<?php
// Desactivar caché para todas las peticiones dinámicas de la base de datos
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

// Normalizar zona horaria de PHP a UTC
date_default_timezone_set('UTC');

$host = 'sql305.ezyro.com';
$db   = 'ezyro_42243718_gutisite';
$user = 'ezyro_42243718';

// IMPORTANTE: Reemplace este marcador con su contraseña de base de datos
// (que suele ser la misma contraseña de su cuenta de hosting de InfinityFree).
$pass = 'America*1990';
$charset = 'utf8mb4';

//$host = 'localhost';
//$db   = 'anayaOutlet';
//$user = 'root';
//$pass = ''; 
//$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset;port=3306";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);

     // Forzar huso horario UTC en la sesión de base de datos
     $pdo->exec("SET time_zone = '+00:00'");

     // Crear la tabla de auditoría (self-healing) si no existe
     $checkAuditTable = $pdo->query("SHOW TABLES LIKE 'audit_logs'")->fetch();
     if (!$checkAuditTable) {
         $createAuditSQL = "CREATE TABLE IF NOT EXISTS audit_logs (
             id INT AUTO_INCREMENT PRIMARY KEY,
             user_id INT NULL,
             user_name VARCHAR(150) NULL,
             action VARCHAR(100) NOT NULL,
             table_name VARCHAR(100) NOT NULL,
             record_id INT NULL,
             description TEXT NOT NULL,
             ip_address VARCHAR(45) NULL,
             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
             INDEX idx_audit_created (created_at),
             INDEX idx_audit_action (action)
         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
         $pdo->exec($createAuditSQL);
     }

     // Crear la tabla cash_sessions si no existe (self-healing)
     $checkSessions = $pdo->query("SHOW TABLES LIKE 'cash_sessions'")->fetch();
     if (!$checkSessions) {
         $createSessionsSQL = "CREATE TABLE IF NOT EXISTS cash_sessions (
             id INT AUTO_INCREMENT PRIMARY KEY,
             custom_id VARCHAR(20) NOT NULL UNIQUE,
             user_id INT NOT NULL,
             status ENUM('Abierta', 'Cerrada') NOT NULL DEFAULT 'Abierta',
             opening_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
             closing_date TIMESTAMP NULL DEFAULT NULL,
             initial_base DECIMAL(10,2) NOT NULL DEFAULT 0.00,
             cash_sales DECIMAL(10,2) NOT NULL DEFAULT 0.00,
             card_sales DECIMAL(10,2) NOT NULL DEFAULT 0.00,
             cash_inflows DECIMAL(10,2) NOT NULL DEFAULT 0.00,
             cash_outflows DECIMAL(10,2) NOT NULL DEFAULT 0.00,
             expected_cash DECIMAL(10,2) NOT NULL DEFAULT 0.00,
             real_cash DECIMAL(10,2) NULL DEFAULT NULL,
             difference DECIMAL(10,2) NULL DEFAULT NULL,
             notes TEXT NULL,
             FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
         $pdo->exec($createSessionsSQL);
     }

     // Crear la tabla cash_movements si no existe (self-healing)
     $checkMovements = $pdo->query("SHOW TABLES LIKE 'cash_movements'")->fetch();
     if (!$checkMovements) {
         $createMovementsSQL = "CREATE TABLE IF NOT EXISTS cash_movements (
             id INT AUTO_INCREMENT PRIMARY KEY,
             cash_session_id INT NOT NULL,
             user_id INT NOT NULL,
             type ENUM('Entrada', 'Salida') NOT NULL,
             amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
             reason VARCHAR(255) NOT NULL,
             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
             FOREIGN KEY (cash_session_id) REFERENCES cash_sessions(id) ON DELETE CASCADE,
             FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
         $pdo->exec($createMovementsSQL);
     }

     // Asegurar que la tabla 'users' tiene la columna 'theme' si existe
     $checkUsersTable = $pdo->query("SHOW TABLES LIKE 'users'")->fetch();
     if ($checkUsersTable) {
         $checkThemeColumn = $pdo->query("SHOW COLUMNS FROM `users` LIKE 'theme'")->fetch();
         if (!$checkThemeColumn) {
             $pdo->exec("ALTER TABLE `users` ADD COLUMN `theme` VARCHAR(50) NOT NULL DEFAULT 'light'");
         }
     }

     // Validar y auto-reparar la sesión del usuario para prevenir fallos de clave foránea
     if (session_status() === PHP_SESSION_NONE) {
         session_start();
     }

     if (isset($_SESSION['loggedIn']) && $_SESSION['loggedIn'] === true) {
         $userId = isset($_SESSION['userId']) ? intval($_SESSION['userId']) : 0;
         
         // Asegurar que la tabla 'users' existe antes de consultar
         $checkUsersTable = $pdo->query("SHOW TABLES LIKE 'users'")->fetch();
         if ($checkUsersTable) {
             $userExists = false;
             if ($userId > 0) {
                 $check = $pdo->prepare("SELECT id, theme FROM users WHERE id = :id LIMIT 1");
                 $check->execute(['id' => $userId]);
                 $uRow = $check->fetch();
                 if ($uRow) {
                     $userExists = true;
                     $_SESSION['theme'] = $uRow['theme'];
                 }
             }
             
             if (!$userExists) {
                 $email = isset($_SESSION['email']) ? $_SESSION['email'] : '';
                 $checkEmail = $pdo->prepare("SELECT id, theme FROM users WHERE email = :email LIMIT 1");
                 $checkEmail->execute(['email' => $email]);
                 $usr = $checkEmail->fetch();
                 if ($usr) {
                     $_SESSION['userId'] = $usr['id'];
                     $_SESSION['theme'] = $usr['theme'];
                 } else {
                     $first = $pdo->query("SELECT id, name, email, role, theme FROM users LIMIT 1")->fetch();
                     if ($first) {
                         $_SESSION['userId'] = $first['id'];
                         $_SESSION['name'] = $first['name'];
                         $_SESSION['email'] = $first['email'];
                         $_SESSION['role'] = $first['role'];
                         $_SESSION['theme'] = $first['theme'];
                     } else {
                         session_destroy();
                         $_SESSION = [];
                     }
                 }
             }
         }
     }
} catch (\PDOException $e) {
     // Retorna error en formato JSON
     header('Content-Type: application/json; charset=utf-8');
     http_response_code(500);
     echo json_encode([
         'success' => false,
         'message' => 'Error de conexión a la base de datos: ' . $e->getMessage()
     ]);
     exit;
}

// Función helper global para registrar auditoría de acciones en el ERP
function write_audit_log($pdo, $action, $tableName, $recordId, $description) {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    $userId = isset($_SESSION['userId']) ? intval($_SESSION['userId']) : null;
    $userName = isset($_SESSION['name']) ? $_SESSION['name'] : 'Sistema/Tienda';

    // Obtener IP real del cliente
    $ip = '127.0.0.1';
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        $ip = $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
    } elseif (!empty($_SERVER['REMOTE_ADDR'])) {
        $ip = $_SERVER['REMOTE_ADDR'];
    }

    try {
        $stmt = $pdo->prepare('
            INSERT INTO audit_logs (user_id, user_name, action, table_name, record_id, description, ip_address)
            VALUES (:user_id, :user_name, :action, :table_name, :record_id, :description, :ip_address)
        ');
        $stmt->execute([
            'user_id' => $userId,
            'user_name' => $userName,
            'action' => $action,
            'table_name' => $tableName,
            'record_id' => $recordId,
            'description' => $description,
            'ip_address' => $ip
        ]);
    } catch (Exception $e) {
        error_log("Audit log failed: " . $e->getMessage());
    }
}
?>
