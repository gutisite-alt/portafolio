<?php
// ============================================================
// ACTUALIZAR ESTADO DE ÓRDEN DE COMPRA (POST) — ANAYA ERP
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

$poId = isset($input['id']) ? intval($input['id']) : 0;
$newStatus = isset($input['status']) ? trim($input['status']) : '';

if ($poId <= 0 || !in_array($newStatus, ['Pendiente', 'Aprobada', 'Recibida'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Parámetros inválidos para actualizar la órden.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Obtener la órden de compra actual para validar
    $stmt = $pdo->prepare('SELECT id, status, po_number FROM purchase_orders WHERE id = :id FOR UPDATE');
    $stmt->execute(['id' => $poId]);
    $po = $stmt->fetch();

    if (!$po) {
        throw new Exception("La órden de compra con ID $poId no existe.");
    }

    $oldStatus = $po['status'];
    $poNumber = $po['po_number'];

    if ($oldStatus === 'Recibida') {
        throw new Exception("Esta órden de compra ya ha sido Recibida y el stock fue incrementado anteriormente.");
    }

    // Si transiciona a Recibida, se incrementa el stock de cada producto y se logea el movimiento
    if ($newStatus === 'Recibida') {
        // Obtener artículos de la órden
        $itemStmt = $pdo->prepare('
            SELECT poi.product_id, poi.qty, p.name, p.sku, p.min_stock
            FROM purchase_order_items poi
            JOIN products p ON poi.product_id = p.id
            WHERE poi.purchase_order_id = :po_id
        ');
        $itemStmt->execute(['po_id' => $poId]);
        $items = $itemStmt->fetchAll();

        // Asegurarse de que la tabla de movimientos de inventario existe
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
        $date = date('Y-m-d');

        foreach ($items as $item) {
            $pId = intval($item['product_id']);
            $qty = intval($item['qty']);

            // Bloqueo de concurrencia para evitar condiciones de carrera en el stock
            $lockProd = $pdo->prepare('SELECT id, stock, min_stock FROM products WHERE id = :id FOR UPDATE');
            $lockProd->execute(['id' => $pId]);
            $prodRow = $lockProd->fetch();

            if ($prodRow) {
                $newStock = intval($prodRow['stock']) + $qty;
                $minStock = intval($prodRow['min_stock']);
                $newStatus = 'Disponible';
                if ($newStock === 0) {
                    $newStatus = 'Agotado';
                } elseif ($newStock <= $minStock) {
                    $newStatus = 'Bajo Stock';
                }

                // Incrementar stock y actualizar estado en productos
                $updStock = $pdo->prepare('
                    UPDATE products 
                    SET stock = :stock, status = :status
                    WHERE id = :id
                ');
                $updStock->execute([
                    'stock' => $newStock,
                    'status' => $newStatus,
                    'id' => $pId
                ]);
            }

            // Registrar Kardex (Entrada)
            $movStmt = $pdo->prepare('
                INSERT INTO inventory_movements (custom_id, product_id, qty, type, reason, date, user_id)
                VALUES ("TEMP", :product_id, :qty, "Entrada", :reason, :date, :user_id)
            ');
            $movStmt->execute([
                'product_id' => $pId,
                'qty' => $qty,
                'reason' => "Reaprovisionamiento $poNumber",
                'date' => $date,
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
    }

    // Actualizar estado de la órden de compra
    $updPO = $pdo->prepare('UPDATE purchase_orders SET status = :status WHERE id = :id');
    $updPO->execute(['status' => $newStatus, 'id' => $poId]);

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => "Estado de la órden de compra actualizado a '$newStatus' correctamente."
    ]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
