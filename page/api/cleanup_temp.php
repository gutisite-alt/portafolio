<?php
// ============================================================
// SCRIPT TEMPORAL DE LIMPIEZA — ANAYA ERP
// ============================================================
require_once '../config/db_connect.php';

try {
    // Eliminar el producto huérfano con SKU duplicado de la primera inserción fallida
    $stmt = $pdo->prepare("DELETE FROM products WHERE sku = 'BA-555-06X'");
    $stmt->execute();
    
    echo "<h1>Limpieza Completada con Éxito</h1>";
    echo "<p>El producto huérfano con SKU <b>BA-555-06X</b> ha sido eliminado de la base de datos.</p>";
    echo "<p>Ya puedes volver al ERP y guardar el producto normalmente.</p>";
} catch (\PDOException $e) {
    echo "<h1>Error en la Limpieza</h1>";
    echo "<p>Detalles del error: " . $e->getMessage() . "</p>";
}

// Auto-eliminar el script por motivos de seguridad
unlink(__FILE__);
?>
