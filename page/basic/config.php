<?php
// Configuración de la base de datos
define('DB_HOST', 'sql305.ezyro.com');
define('DB_NAME', 'ezyro_42243718_gutisite');
define('DB_USER', 'ezyro_42243718');
define('DB_PASSWORD', 'America*1990');
define('DB_CHARSET', 'utf8mb4');

try {
    // Cadena de conexión (DSN)
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    
    // Opciones de configuración de PDO
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Lanzar excepciones en errores
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Devolver arreglos asociativos por defecto
        PDO::ATTR_EMULATE_PREPARES   => false,                  // Deshabilitar la emulación de consultas preparadas
    ];
    
    // Crear la instancia de conexión PDO
    $pdo = new PDO($dsn, DB_USER, DB_PASSWORD, $options);
    
} catch (PDOException $e) {
    // Si la conexión falla, se detiene la ejecución y se muestra el error (puedes personalizar esto en producción)
    die("Error de conexión a la base de datos: " . $e->getMessage());
}
?>
