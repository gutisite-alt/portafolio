<?php
// ============================================================
// ELIMINAR PRODUCTO (POST) — ANAYA ERP
// ============================================================

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');

// Verificar sesión activa y rol de administrador
if (!isset($_SESSION['loggedIn']) || $_SESSION['loggedIn'] !== true || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado. Permisos de administrador requeridos.']);
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

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de producto inválido.']);
    exit;
}

try {
    // 1. Obtener datos del producto antes de eliminarlo para la auditoría y borrado físico de imagen
    $stmtImg = $pdo->prepare('SELECT sku, name, image_url FROM products WHERE id = :id LIMIT 1');
    $stmtImg->execute(['id' => $id]);
    $productRow = $stmtImg->fetch();
    $sku = $productRow ? $productRow['sku'] : '';
    $name = $productRow ? $productRow['name'] : '';
    $imageUrl = $productRow ? $productRow['image_url'] : '';

    // 2. Ejecutar borrado en cascada manual de las relaciones en una transacción
    $pdo->beginTransaction();

    // Eliminar movimientos de inventario asociados
    $delMovs = $pdo->prepare('DELETE FROM inventory_movements WHERE product_id = :id');
    $delMovs->execute(['id' => $id]);

    // Eliminar ítems de facturas de venta asociados
    $delInvoiceItems = $pdo->prepare('DELETE FROM invoice_items WHERE product_id = :id');
    $delInvoiceItems->execute(['id' => $id]);

    // Eliminar ítems de órdenes de compra asociados
    $delPOItems = $pdo->prepare('DELETE FROM purchase_order_items WHERE product_id = :id');
    $delPOItems->execute(['id' => $id]);

    // Eliminar el producto del catálogo
    $delProd = $pdo->prepare('DELETE FROM products WHERE id = :id');
    $delProd->execute(['id' => $id]);

    $pdo->commit();

    // Registrar Auditoría de Eliminación
    write_audit_log($pdo, 'PRODUCT_DELETE', 'products', $id, "Se eliminó definitivamente el producto '$name' (SKU: $sku, ID: $id) del catálogo.");

    // 3. Eliminar la imagen del disco y su subcarpeta única si reside localmente en la carpeta uploads
    if (!empty($imageUrl) && strpos($imageUrl, 'uploads/') === 0) {
        $filePath = '../' . $imageUrl;
        if (file_exists($filePath) && is_file($filePath)) {
            unlink($filePath);
            
            // También eliminar el directorio contenedor si es una subcarpeta de uploads
            $dirPath = dirname($filePath);
            if (basename(dirname($dirPath)) === 'uploads' && is_dir($dirPath)) {
                $files = glob($dirPath . '/*');
                if (empty($files)) {
                    @rmdir($dirPath);
                }
            }
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Producto, su imagen física e historial asociado eliminados de forma definitiva.'
    ]);

} catch (\PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al eliminar el producto de la base de datos: ' . $e->getMessage()]);
}
?>
