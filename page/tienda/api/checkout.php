<?php
// ============================================================
// REGISTRAR SOLICITUD DE PEDIDO WEB (POST) - TIENDA ONLINE
// ============================================================

header('Content-Type: application/json; charset=utf-8');

// Permitir solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido. Se requiere POST.']);
    exit;
}

require_once '../../config/db_connect.php';

$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

// Datos del comprador
$name = isset($input['name']) ? trim($input['name']) : '';
$document = isset($input['document']) ? trim($input['document']) : '';
$phone = isset($input['phone']) ? trim($input['phone']) : '';
$email = isset($input['email']) ? trim($input['email']) : '';
$address = isset($input['address']) ? trim($input['address']) : '';
$city = isset($input['city']) ? trim($input['city']) : '';
$preferredStore = isset($input['preferredStore']) ? trim($input['preferredStore']) : 'Torrefarrera';
$comments = isset($input['comments']) ? trim($input['comments']) : '';
$cartItems = isset($input['products']) ? $input['products'] : []; // Array de: [ {productId: X, qty: Y} ]

// Validar campos del comprador
if (empty($name) || empty($document) || empty($phone) || empty($email) || empty($address) || empty($city)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Todos los datos de envío y facturación son obligatorios.']);
    exit;
}

// Validar artículos del carrito
if (empty($cartItems)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El carrito de compras está vacío.']);
    exit;
}

try {
    // 3. Crear tablas de solicitudes web autosanables (Self-healing) si no existen (Ejecutar ANTES del inicio de transacción)
    $pdo->exec("CREATE TABLE IF NOT EXISTS web_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        custom_id VARCHAR(20) NOT NULL UNIQUE,
        order_number VARCHAR(50) NOT NULL UNIQUE,
        client_name VARCHAR(150) NOT NULL,
        client_document VARCHAR(50) NOT NULL,
        client_email VARCHAR(150) NOT NULL,
        client_phone VARCHAR(50) NOT NULL,
        client_address VARCHAR(255) NOT NULL,
        client_city VARCHAR(100) NOT NULL,
        preferred_store VARCHAR(100) NOT NULL,
        comments TEXT NULL,
        total DECIMAL(10,2) NOT NULL,
        status ENUM('Pendiente', 'Procesado', 'Cancelado') DEFAULT 'Pendiente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    $pdo->exec("CREATE TABLE IF NOT EXISTS web_order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        web_order_id INT NOT NULL,
        product_id INT NOT NULL,
        qty INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (web_order_id) REFERENCES web_orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    $pdo->beginTransaction();

    // 1. Obtener la tasa de impuestos y moneda desde la configuración
    $settingsStmt = $pdo->query('SELECT tax_rate, currency FROM settings LIMIT 1');
    $settings = $settingsStmt->fetch();
    $currency = $settings ? $settings['currency'] : '€';

    // 2. Verificar existencia de productos y precios en la base de datos
    $processedProducts = [];
    $total = 0.00;

    foreach ($cartItems as $item) {
        $pId = intval($item['productId']);
        $qty = intval($item['qty']);

        if ($qty <= 0) {
            throw new Exception("Cantidad inválida para el producto ID $pId.");
        }

        // Obtener datos reales del producto (sin FOR UPDATE ya que no bloqueamos stock en esta fase)
        $stmt = $pdo->prepare('SELECT id, name, sell_price FROM products WHERE id = :id');
        $stmt->execute(['id' => $pId]);
        $prod = $stmt->fetch();

        if (!$prod) {
            throw new Exception("El producto con ID $pId no existe en el catálogo.");
        }

        $price = floatval($prod['sell_price']);
        $itemTotal = $price * $qty;
        $total += $itemTotal;

        $processedProducts[] = [
            'id' => $prod['id'],
            'name' => $prod['name'],
            'qty' => $qty,
            'price' => $price
        ];
    }

    // 4. Generar numeración de pedido web
    $orderCountStmt = $pdo->query('SELECT COALESCE(MAX(id), 0) AS max_id FROM web_orders');
    $maxOrderId = intval($orderCountStmt->fetch()['max_id']);
    $nextOrderId = $maxOrderId + 1;
    
    $orderNum = 'PED-' . date('Y') . '-' . str_pad($nextOrderId, 3, '0', STR_PAD_LEFT);
    $customOrderId = 'REQ-' . (500 + $nextOrderId);

    // 5. Insertar cabecera de la solicitud web
    $stmt = $pdo->prepare('
        INSERT INTO web_orders (custom_id, order_number, client_name, client_document, client_email, client_phone, client_address, client_city, preferred_store, comments, total, status)
        VALUES (:custom_id, :order_number, :client_name, :client_document, :client_email, :client_phone, :client_address, :client_city, :preferred_store, :comments, :total, "Pendiente")
    ');
    $stmt->execute([
        'custom_id' => $customOrderId,
        'order_number' => $orderNum,
        'client_name' => $name,
        'client_document' => $document,
        'client_email' => $email,
        'client_phone' => $phone,
        'client_address' => $address,
        'client_city' => $city,
        'preferred_store' => $preferredStore,
        'comments' => $comments,
        'total' => round($total, 2)
    ]);
    
    $webOrderId = $pdo->lastInsertId();

    // 6. Insertar ítems de la solicitud web
    foreach ($processedProducts as $prod) {
        $itemStmt = $pdo->prepare('
            INSERT INTO web_order_items (web_order_id, product_id, qty, price)
            VALUES (:web_order_id, :product_id, :qty, :price)
        ');
        $itemStmt->execute([
            'web_order_id' => $webOrderId,
            'product_id' => $prod['id'],
            'qty' => $prod['qty'],
            'price' => $prod['price']
        ]);
    }

    $pdo->commit();

    // Retornamos las variables mapeadas a nombres de factura para compatibilidad directa con el front
    echo json_encode([
        'success' => true,
        'message' => '¡Solicitud registrada con éxito!',
        'invoiceNumber' => $orderNum,
        'invoiceId' => $customOrderId,
        'total' => round($total, 2),
        'currency' => $currency
    ]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al guardar la solicitud: ' . $e->getMessage()
    ]);
}
?>
