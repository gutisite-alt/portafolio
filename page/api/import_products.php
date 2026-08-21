<?php
// ============================================================
// IMPORTAR PRODUCTOS MASIVAMENTE (POST) — ANAYA ERP
// ============================================================

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');

// 1. Verificar sesión activa
if (!isset($_SESSION['loggedIn']) || $_SESSION['loggedIn'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado. Inicie sesión.']);
    exit;
}

// 2. Permitir solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido. Se requiere POST.']);
    exit;
}

require_once '../config/db_connect.php';

// 3. Obtener e interpretar el JSON de entrada
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);
$products = isset($input['products']) ? $input['products'] : [];

if (empty($products) || !is_array($products)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No se encontraron datos de productos para importar.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Asegurarse de que la tabla de movimientos de inventario existe (self-healing)
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

    $importedCount = 0;
    $updatedCount = 0;
    $userId = isset($_SESSION['userId']) ? intval($_SESSION['userId']) : 1;

    // Preparar sentencias SQL comunes para mejorar rendimiento
    $stmtCat = $pdo->prepare('INSERT IGNORE INTO categories (name) VALUES (:name)');
    $stmtBrand = $pdo->prepare('INSERT IGNORE INTO brands (name) VALUES (:name)');
    
    $stmtExist = $pdo->prepare('SELECT id, stock FROM products WHERE sku = :sku LIMIT 1');
    
    $stmtInsert = $pdo->prepare('
        INSERT INTO products (sku, name, brand, category, buy_price, sell_price, stock, min_stock, weight, dimensions, description, status)
        VALUES (:sku, :name, :brand, :category, :buy_price, :sell_price, :stock, :min_stock, :weight, :dimensions, :description, :status)
    ');

    $stmtUpdate = $pdo->prepare('
        UPDATE products SET
            name = :name,
            brand = :brand,
            category = :category,
            buy_price = :buy_price,
            sell_price = :sell_price,
            stock = :stock,
            min_stock = :min_stock,
            weight = :weight,
            dimensions = :dimensions,
            description = :description,
            status = :status
        WHERE id = :id
    ');

    $stmtMove = $pdo->prepare('
        INSERT INTO inventory_movements (custom_id, product_id, qty, type, reason, date, user_id)
        VALUES (:custom_id, :product_id, :qty, :type, :reason, :date, :user_id)
    ');

    foreach ($products as $index => $item) {
        $sku = isset($item['sku']) ? trim($item['sku']) : '';
        $name = isset($item['name']) ? trim($item['name']) : '';
        $brand = isset($item['brand']) ? trim($item['brand']) : 'General';
        $category = isset($item['category']) ? trim($item['category']) : 'General';
        $buyPrice = isset($item['buyPrice']) ? floatval($item['buyPrice']) : 0.00;
        $sellPrice = isset($item['sellPrice']) ? floatval($item['sellPrice']) : 0.00;
        $stock = isset($item['stock']) ? intval($item['stock']) : 0;
        $minStock = isset($item['minStock']) ? intval($item['minStock']) : 0;
        $weight = (isset($item['weight']) && trim($item['weight']) !== '') ? trim($item['weight']) : null;
        $dimensions = (isset($item['dimensions']) && trim($item['dimensions']) !== '') ? trim($item['dimensions']) : null;
        $description = (isset($item['description']) && trim($item['description']) !== '') ? trim($item['description']) : null;

        // Validación básica
        if (empty($sku) || empty($name)) {
            throw new Exception("Fila " . ($index + 1) . ": SKU y Nombre son obligatorios.");
        }
        if ($buyPrice < 0 || $sellPrice < 0) {
            throw new Exception("Fila " . ($index + 1) . " ($sku): Los precios no pueden ser negativos.");
        }

        // Determinar el estado del stock
        $status = 'Disponible';
        if ($stock === 0) {
            $status = 'Agotado';
        } elseif ($stock <= $minStock) {
            $status = 'Bajo Stock';
        }

        // Crear marca y categoría si no existen
        $stmtCat->execute(['name' => $category]);
        $stmtBrand->execute(['name' => $brand]);

        // Verificar si existe el SKU
        $stmtExist->execute(['sku' => $sku]);
        $existing = $stmtExist->fetch();

        $productId = 0;
        $diffStock = 0;

        if ($existing) {
            // Caso A: El producto ya existe -> Actualizar (UPSERT)
            $productId = intval($existing['id']);
            $oldStock = intval($existing['stock']);
            $diffStock = $stock - $oldStock;

            $stmtUpdate->execute([
                'name' => $name,
                'brand' => $brand,
                'category' => $category,
                'buy_price' => $buyPrice,
                'sell_price' => $sellPrice,
                'stock' => $stock,
                'min_stock' => $minStock,
                'weight' => $weight,
                'dimensions' => $dimensions,
                'description' => $description,
                'status' => $status,
                'id' => $productId
            ]);
            $updatedCount++;
        } else {
            // Caso B: El producto es nuevo -> Insertar
            $stmtInsert->execute([
                'sku' => $sku,
                'name' => $name,
                'brand' => $brand,
                'category' => $category,
                'buy_price' => $buyPrice,
                'sell_price' => $sellPrice,
                'stock' => $stock,
                'min_stock' => $minStock,
                'weight' => $weight,
                'dimensions' => $dimensions,
                'description' => $description,
                'status' => $status
            ]);
            $productId = intval($pdo->lastInsertId());
            $diffStock = $stock;
            $importedCount++;
        }

        // Registrar movimiento de inventario si hay variación en el stock
        if ($diffStock != 0) {
            $movCustomId = 'MOV-IMP-' . time() . '-' . rand(100, 999) . '-' . $productId;
            $stmtMove->execute([
                'custom_id' => substr($movCustomId, 0, 20),
                'product_id' => $productId,
                'qty' => $diffStock,
                'type' => $diffStock > 0 ? 'Entrada' : 'Salida',
                'reason' => 'Importación masiva desde CSV',
                'date' => date('Y-m-d'),
                'user_id' => $userId
            ]);
        }
    }

    $pdo->commit();

    // Registrar log de auditoría global
    $descLog = "Importación masiva completada. Productos nuevos creados: $importedCount, Productos existentes actualizados: $updatedCount.";
    write_audit_log($pdo, 'IMPORTAR', 'products', null, $descLog);

    echo json_encode([
        'success' => true,
        'message' => "Proceso completado. $importedCount productos nuevos importados, $updatedCount actualizados con éxito.",
        'imported' => $importedCount,
        'updated' => $updatedCount
    ]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error durante la importación: ' . $e->getMessage()
    ]);
}
