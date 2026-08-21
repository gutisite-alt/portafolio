<?php
// ============================================================
// REGISTRAR O ACTUALIZAR PRODUCTO (POST) — ANAYA ERP
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
$sku = isset($input['sku']) ? trim($input['sku']) : '';
$brand = isset($input['brand']) ? trim($input['brand']) : '';
$category = isset($input['category']) ? trim($input['category']) : '';
$supplierId = isset($input['supplierId']) ? intval($input['supplierId']) : null;
$buyPrice = isset($input['buyPrice']) ? floatval($input['buyPrice']) : 0.00;
$sellPrice = isset($input['sellPrice']) ? floatval($input['sellPrice']) : 0.00;
$stock = isset($input['stock']) ? intval($input['stock']) : 0;
$minStock = isset($input['minStock']) ? intval($input['minStock']) : 0;
$weight = isset($input['weight']) ? trim($input['weight']) : null;
$dimensions = isset($input['dimensions']) ? trim($input['dimensions']) : null;
$imageUrl = isset($input['image']) ? trim($input['image']) : '';
$description = isset($input['description']) ? trim($input['description']) : null;

if (empty($name) || empty($sku) || empty($brand) || empty($category)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Los campos de Nombre, SKU, Marca y Categoría son obligatorios.']);
    exit;
}

if ($buyPrice < 0 || $sellPrice < 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Los precios de compra y venta no pueden ser negativos.']);
    exit;
}

// Determinar el estado del stock
$status = 'Disponible';
if ($stock === 0) {
    $status = 'Agotado';
} elseif ($stock <= $minStock) {
    $status = 'Bajo Stock';
}

try {
    if ($id > 0) {
        // Validar SKU único exceptuando el actual
        $stmt = $pdo->prepare('SELECT id FROM products WHERE sku = :sku AND id != :id LIMIT 1');
        $stmt->execute(['sku' => $sku, 'id' => $id]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Ya existe otra referencia registrada con ese SKU.']);
            exit;
        }

        // Obtener el estado previo del producto para auditar cambios
        $stmtOld = $pdo->prepare('SELECT * FROM products WHERE id = :id LIMIT 1');
        $stmtOld->execute(['id' => $id]);
        $oldProd = $stmtOld->fetch();

        // Actualizar producto
        $stmt = $pdo->prepare('
            UPDATE products SET 
                sku = :sku, 
                name = :name, 
                brand = :brand, 
                category = :category, 
                supplier_id = :supplier_id, 
                buy_price = :buy_price, 
                sell_price = :sell_price, 
                stock = :stock, 
                min_stock = :min_stock, 
                weight = :weight, 
                dimensions = :dimensions, 
                image_url = :image_url, 
                description = :description,
                status = :status
            WHERE id = :id
        ');
        $stmt->execute([
            'sku' => $sku,
            'name' => $name,
            'brand' => $brand,
            'category' => $category,
            'supplier_id' => $supplierId,
            'buy_price' => $buyPrice,
            'sell_price' => $sellPrice,
            'stock' => $stock,
            'min_stock' => $minStock,
            'weight' => $weight,
            'dimensions' => $dimensions,
            'image_url' => $imageUrl,
            'description' => $description,
            'status' => $status,
            'id' => $id
        ]);

        // Registrar Auditoría
        if ($oldProd) {
            $changes = [];
            if ($oldProd['sku'] !== $sku) $changes[] = "SKU: '{$oldProd['sku']}' -> '$sku'";
            if ($oldProd['name'] !== $name) $changes[] = "Nombre: '{$oldProd['name']}' -> '$name'";
            if ($oldProd['brand'] !== $brand) $changes[] = "Marca: '{$oldProd['brand']}' -> '$brand'";
            if ($oldProd['category'] !== $category) $changes[] = "Categoría: '{$oldProd['category']}' -> '$category'";
            if (floatval($oldProd['buy_price']) !== floatval($buyPrice)) $changes[] = "P. Compra: {$oldProd['buy_price']}€ -> {$buyPrice}€";
            if (floatval($oldProd['sell_price']) !== floatval($sellPrice)) $changes[] = "P. Venta: {$oldProd['sell_price']}€ -> {$sellPrice}€";
            if (intval($oldProd['stock']) !== intval($stock)) $changes[] = "Stock: {$oldProd['stock']} -> $stock";
            if (intval($oldProd['min_stock']) !== intval($minStock)) $changes[] = "Stock Mínimo: {$oldProd['min_stock']} -> $minStock";
            
            $desc = "Se actualizó el producto '{$name}' (ID {$id}).";
            if (!empty($changes)) {
                $desc .= " Cambios realizados: " . implode(', ', $changes);
            } else {
                $desc .= " Sin cambios en los valores principales.";
            }
            write_audit_log($pdo, 'PRODUCT_UPDATE', 'products', $id, $desc);
        }

        echo json_encode(['success' => true, 'message' => 'Referencia de producto actualizada con éxito.', 'productId' => $id]);
    } else {
        // Validar SKU único
        $stmt = $pdo->prepare('SELECT id FROM products WHERE sku = :sku LIMIT 1');
        $stmt->execute(['sku' => $sku]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Ya existe un producto registrado con ese SKU.']);
            exit;
        }

        // Registrar nuevo producto
        $pdo->beginTransaction();

        $stmt = $pdo->prepare('
            INSERT INTO products (sku, name, brand, category, supplier_id, buy_price, sell_price, stock, min_stock, weight, dimensions, image_url, description, status)
            VALUES (:sku, :name, :brand, :category, :supplier_id, :buy_price, :sell_price, :stock, :min_stock, :weight, :dimensions, :image_url, :description, :status)
        ');
        $stmt->execute([
            'sku' => $sku,
            'name' => $name,
            'brand' => $brand,
            'category' => $category,
            'supplier_id' => $supplierId,
            'buy_price' => $buyPrice,
            'sell_price' => $sellPrice,
            'stock' => $stock,
            'min_stock' => $minStock,
            'weight' => $weight,
            'dimensions' => $dimensions,
            'image_url' => $imageUrl,
            'description' => $description,
            'status' => $status
        ]);

        $newProductId = $pdo->lastInsertId();

        // Logear movimiento inicial si stock > 0
        if ($stock > 0) {
            $checkMovements = $pdo->query("SHOW TABLES LIKE 'inventory_movements'")->fetch();
            if (!$checkMovements) {
                $createMovsSQL = "CREATE TABLE IF NOT EXISTS inventory_movements (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    custom_id VARCHAR(20) NOT NULL UNIQUE,
                    product_id INT NOT NULL,
                    qty INT NOT NULL,
                    type ENUM('Entrada', 'Salida', 'Ajuste') NOT NULL,
                    reason VARCHAR(255) NOT NULL,
                    date DATE NOT NULL,
                    user_id INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
                    INDEX idx_movement_date (date),
                    INDEX idx_movement_product (product_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
                $pdo->exec($createMovsSQL);
            }

            $userId = isset($_SESSION['userId']) ? intval($_SESSION['userId']) : 1;
            
            $movStmt = $pdo->prepare('
                INSERT INTO inventory_movements (custom_id, product_id, qty, type, reason, date, user_id)
                VALUES ("TEMP", :product_id, :qty, "Entrada", "Registro inicial de catálogo", :date, :user_id)
            ');
            $movStmt->execute([
                'product_id' => $newProductId,
                'qty' => $stock,
                'date' => date('Y-m-d'),
                'user_id' => $userId
            ]);

            $newMovId = $pdo->lastInsertId();
            $customMovId = 'MOV-' . (500 + $newMovId);

            $updateMovStmt = $pdo->prepare('UPDATE inventory_movements SET custom_id = :custom_id WHERE id = :id');
            $updateMovStmt->execute([
                'custom_id' => $customMovId,
                'id' => $newMovId
            ]);
        }

        // Registrar Auditoría
        write_audit_log($pdo, 'PRODUCT_CREATE', 'products', $newProductId, "Se registró un nuevo producto: '$name' (SKU: $sku), Precio de Venta: $sellPrice €, Stock inicial: $stock.");

        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Producto registrado exitosamente en el catálogo.', 'productId' => $newProductId]);
    }
} catch (\PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al guardar el producto: ' . $e->getMessage()]);
}
?>
