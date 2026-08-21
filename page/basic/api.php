<?php
// Habilitar reporte de errores para desarrollo (se puede desactivar en producción)
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
session_start();

require_once 'config.php';

// Helper para responder con JSON y finalizar
function jsonResponse($success, $data = null, $message = '') {
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'message' => $message
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Obtener datos del cuerpo de la petición (JSON) si los hay
$inputData = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    if (!empty($rawInput)) {
        $inputData = json_decode($rawInput, true) ?: [];
    }
    // Combinar con $_POST por compatibilidad
    $inputData = array_merge($_POST, $inputData);
}

// Verificar que la acción esté presente
$action = isset($_GET['action']) ? $_GET['action'] : '';

if (empty($action)) {
    jsonResponse(false, null, 'Acción no especificada.');
}

// Función auxiliar para registrar logs de auditoría
function logAudit($pdo, $actionName, $tableName, $recordId, $description) {
    try {
        $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
        $userName = isset($_SESSION['user_name']) ? $_SESSION['user_name'] : 'Sistema/Anónimo';
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

        $stmt = $pdo->prepare("INSERT INTO audit_logs (user_id, user_name, action, table_name, record_id, description, ip_address) 
                               VALUES (:user_id, :user_name, :action, :table_name, :record_id, :description, :ip)");
        $stmt->execute([
            'user_id' => $userId,
            'user_name' => $userName,
            'action' => $actionName,
            'table_name' => $tableName,
            'record_id' => $recordId,
            'description' => $description,
            'ip' => $ip
        ]);
    } catch (Exception $e) {
        // Ignorar errores de auditoría para no bloquear la transacción principal
        error_log("Error al escribir log de auditoría: " . $e->getMessage());
    }
}

// Verificar autenticación para acciones protegidas
$publicActions = ['login', 'check_session'];
if (!in_array($action, $publicActions)) {
    if (!isset($_SESSION['user_id'])) {
        jsonResponse(false, null, 'Sesión no iniciada. Acceso no autorizado.');
    }
}

try {
    switch ($action) {
        case 'login':
            $email = trim($inputData['email'] ?? '');
            $password = $inputData['password'] ?? '';

            if (empty($email) || empty($password)) {
                jsonResponse(false, null, 'Email y contraseña son requeridos.');
            }

            $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email");
            $stmt->execute(['email' => $email]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password'])) {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_name'] = $user['name'];
                $_SESSION['user_role'] = $user['role'];
                $_SESSION['user_email'] = $user['email'];

                logAudit($pdo, 'LOGIN', 'users', $user['id'], "El usuario inició sesión correctamente.");

                jsonResponse(true, [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'theme' => $user['theme'] ?? 'light'
                ], 'Sesión iniciada correctamente.');
            } else {
                jsonResponse(false, null, 'Credenciales incorrectas.');
            }
            break;

        case 'check_session':
            if (isset($_SESSION['user_id'])) {
                jsonResponse(true, [
                    'id' => $_SESSION['user_id'],
                    'name' => $_SESSION['user_name'],
                    'email' => $_SESSION['user_email'],
                    'role' => $_SESSION['user_role']
                ], 'Sesión activa.');
            } else {
                jsonResponse(false, null, 'Sesión inactiva.');
            }
            break;

        case 'logout':
            if (isset($_SESSION['user_id'])) {
                logAudit($pdo, 'LOGOUT', 'users', $_SESSION['user_id'], "El usuario cerró su sesión.");
            }
            session_destroy();
            jsonResponse(true, null, 'Sesión cerrada correctamente.');
            break;

        case 'get_products':
            $stmt = $pdo->query("SELECT * FROM products ORDER BY name ASC");
            $products = $stmt->fetchAll();
            jsonResponse(true, $products);
            break;

        case 'save_product':
            $id = $inputData['id'] ?? null;
            $sku = trim($inputData['sku'] ?? '');
            $name = trim($inputData['name'] ?? '');
            $brand = trim($inputData['brand'] ?? null);
            $category = trim($inputData['category'] ?? null);
            $buy_price = floatval($inputData['buy_price'] ?? 0);
            $sell_price = floatval($inputData['sell_price'] ?? 0);
            $stock = intval($inputData['stock'] ?? 0);
            $min_stock = intval($inputData['min_stock'] ?? 0);
            $description = trim($inputData['description'] ?? null);
            $dimensions = trim($inputData['dimensions'] ?? null);
            $weight = trim($inputData['weight'] ?? null);

            if (empty($sku) || empty($name)) {
                jsonResponse(false, null, 'SKU y nombre de producto son obligatorios.');
            }

            // Determinar estado de stock
            $status = 'Disponible';
            if ($stock <= 0) {
                $status = 'Agotado';
            } elseif ($stock <= $min_stock) {
                $status = 'Bajo Stock';
            }

            if ($id) {
                // Modificar
                $stmt = $pdo->prepare("UPDATE products SET sku = :sku, name = :name, brand = :brand, category = :category, 
                                        buy_price = :buy_price, sell_price = :sell_price, stock = :stock, min_stock = :min_stock, 
                                        description = :description, dimensions = :dimensions, weight = :weight, status = :status 
                                        WHERE id = :id");
                $stmt->execute([
                    'sku' => $sku, 'name' => $name, 'brand' => $brand, 'category' => $category,
                    'buy_price' => $buy_price, 'sell_price' => $sell_price, 'stock' => $stock, 'min_stock' => $min_stock,
                    'description' => $description, 'dimensions' => $dimensions, 'weight' => $weight, 'status' => $status,
                    'id' => $id
                ]);
                logAudit($pdo, 'PRODUCT_UPDATE', 'products', $id, "Se actualizó el producto SKU: $sku, Nombre: $name.");
                jsonResponse(true, ['id' => $id], 'Producto actualizado con éxito.');
            } else {
                // Comprobar SKU duplicado
                $chk = $pdo->prepare("SELECT id FROM products WHERE sku = :sku");
                $chk->execute(['sku' => $sku]);
                if ($chk->fetch()) {
                    jsonResponse(false, null, 'El SKU especificado ya existe.');
                }

                // Crear
                $stmt = $pdo->prepare("INSERT INTO products (sku, name, brand, category, buy_price, sell_price, stock, min_stock, description, dimensions, weight, status) 
                                        VALUES (:sku, :name, :brand, :category, :buy_price, :sell_price, :stock, :min_stock, :description, :dimensions, :weight, :status)");
                $stmt->execute([
                    'sku' => $sku, 'name' => $name, 'brand' => $brand, 'category' => $category,
                    'buy_price' => $buy_price, 'sell_price' => $sell_price, 'stock' => $stock, 'min_stock' => $min_stock,
                    'description' => $description, 'dimensions' => $dimensions, 'weight' => $weight, 'status' => $status
                ]);
                $newId = $pdo->lastInsertId();
                logAudit($pdo, 'PRODUCT_CREATE', 'products', $newId, "Se creó el producto SKU: $sku, Nombre: $name.");
                jsonResponse(true, ['id' => $newId], 'Producto creado con éxito.');
            }
            break;

        case 'get_clients':
            $stmt = $pdo->query("SELECT * FROM clients ORDER BY name ASC");
            $clients = $stmt->fetchAll();
            jsonResponse(true, $clients);
            break;

        case 'save_client':
            $id = $inputData['id'] ?? null;
            $name = trim($inputData['name'] ?? '');
            $document = trim($inputData['document'] ?? '');
            $phone = trim($inputData['phone'] ?? null);
            $email = trim($inputData['email'] ?? null);
            $address = trim($inputData['address'] ?? null);
            $city = trim($inputData['city'] ?? null);

            if (empty($name) || empty($document)) {
                jsonResponse(false, null, 'El nombre y documento del cliente son obligatorios.');
            }

            if ($id) {
                $stmt = $pdo->prepare("UPDATE clients SET name = :name, document = :document, phone = :phone, 
                                        email = :email, address = :address, city = :city WHERE id = :id");
                $stmt->execute([
                    'name' => $name, 'document' => $document, 'phone' => $phone,
                    'email' => $email, 'address' => $address, 'city' => $city, 'id' => $id
                ]);
                logAudit($pdo, 'CLIENT_UPDATE', 'clients', $id, "Se actualizó el cliente: $name ($document).");
                jsonResponse(true, ['id' => $id], 'Cliente actualizado con éxito.');
            } else {
                // Comprobar documento duplicado
                $chk = $pdo->prepare("SELECT id FROM clients WHERE document = :doc");
                $chk->execute(['doc' => $document]);
                if ($chk->fetch()) {
                    jsonResponse(false, null, 'El documento del cliente ya se encuentra registrado.');
                }

                // Generar custom_id secuencial
                $stmtMax = $pdo->query("SELECT MAX(id) as max_id FROM clients");
                $maxId = $stmtMax->fetch()['max_id'] ?? 0;
                $custom_id = "CLI-" . ($maxId + 305); // Seguir un patrón secuencial retro

                $stmt = $pdo->prepare("INSERT INTO clients (custom_id, name, document, phone, email, address, city) 
                                        VALUES (:custom_id, :name, :document, :phone, :email, :address, :city)");
                $stmt->execute([
                    'custom_id' => $custom_id, 'name' => $name, 'document' => $document, 'phone' => $phone,
                    'email' => $email, 'address' => $address, 'city' => $city
                ]);
                $newId = $pdo->lastInsertId();
                logAudit($pdo, 'CLIENT_CREATE', 'clients', $newId, "Se creó el cliente: $name, ID personalizado: $custom_id.");
                jsonResponse(true, ['id' => $newId], 'Cliente creado con éxito.');
            }
            break;

        case 'get_suppliers':
            $stmt = $pdo->query("SELECT * FROM suppliers ORDER BY name ASC");
            $suppliers = $stmt->fetchAll();
            jsonResponse(true, $suppliers);
            break;

        case 'save_supplier':
            $id = $inputData['id'] ?? null;
            $name = trim($inputData['name'] ?? '');
            $contact = trim($inputData['contact'] ?? null);
            $phone = trim($inputData['phone'] ?? null);
            $email = trim($inputData['email'] ?? null);
            $address = trim($inputData['address'] ?? null);
            $status = $inputData['status'] ?? 'Activo';

            if (empty($name)) {
                jsonResponse(false, null, 'El nombre del proveedor es obligatorio.');
            }

            if ($id) {
                $stmt = $pdo->prepare("UPDATE suppliers SET name = :name, contact = :contact, phone = :phone, 
                                        email = :email, address = :address, status = :status WHERE id = :id");
                $stmt->execute([
                    'name' => $name, 'contact' => $contact, 'phone' => $phone,
                    'email' => $email, 'address' => $address, 'status' => $status, 'id' => $id
                ]);
                logAudit($pdo, 'SUPPLIER_UPDATE', 'suppliers', $id, "Se actualizó el proveedor: $name.");
                jsonResponse(true, ['id' => $id], 'Proveedor actualizado con éxito.');
            } else {
                // Generar custom_id secuencial
                $stmtMax = $pdo->query("SELECT MAX(id) as max_id FROM suppliers");
                $maxId = $stmtMax->fetch()['max_id'] ?? 0;
                $custom_id = "SUP-" . ($maxId + 102);

                $stmt = $pdo->prepare("INSERT INTO suppliers (custom_id, name, contact, phone, email, address, status) 
                                        VALUES (:custom_id, :name, :contact, :phone, :email, :address, :status)");
                $stmt->execute([
                    'custom_id' => $custom_id, 'name' => $name, 'contact' => $contact, 'phone' => $phone,
                    'email' => $email, 'address' => $address, 'status' => $status
                ]);
                $newId = $pdo->lastInsertId();
                logAudit($pdo, 'SUPPLIER_CREATE', 'suppliers', $newId, "Se creó el proveedor: $name, ID personalizado: $custom_id.");
                jsonResponse(true, ['id' => $newId], 'Proveedor creado con éxito.');
            }
            break;

        case 'get_invoices':
            $stmt = $pdo->query("SELECT i.*, c.name as client_name, c.document as client_document, u.name as user_name 
                                 FROM invoices i 
                                 LEFT JOIN clients c ON i.client_id = c.id 
                                 LEFT JOIN users u ON i.user_id = u.id 
                                 ORDER BY i.date DESC, i.id DESC");
            $invoices = $stmt->fetchAll();
            jsonResponse(true, $invoices);
            break;

        case 'save_invoice':
            $client_id = intval($inputData['client_id'] ?? 0);
            $payment_method = trim($inputData['payment_method'] ?? 'Tarjeta');
            $tax_rate = intval($inputData['tax_rate'] ?? 21);
            $discount = floatval($inputData['discount'] ?? 0);
            $items = $inputData['items'] ?? []; // Array de {product_id, qty, price}

            if ($client_id <= 0) {
                jsonResponse(false, null, 'Seleccione un cliente válido.');
            }
            if (empty($items)) {
                jsonResponse(false, null, 'La factura debe contener al menos un producto.');
            }

            // Calcular totales
            $subtotal = 0;
            foreach ($items as $item) {
                $subtotal += floatval($item['price']) * intval($item['qty']);
            }
            $tax_amount = round(($subtotal - $discount) * ($tax_rate / 100), 2);
            $total = round($subtotal - $discount + $tax_amount, 2);

            // Generar identificadores
            $pdo->beginTransaction();
            try {
                $stmtMax = $pdo->query("SELECT MAX(id) as max_id FROM invoices");
                $maxId = $stmtMax->fetch()['max_id'] ?? 0;
                $nextNum = $maxId + 1001;
                $custom_id = "INV-" . $nextNum;
                $invoice_number = "F-2026-" . str_pad($nextNum, 4, '0', STR_PAD_LEFT);

                $stmt = $pdo->prepare("INSERT INTO invoices (custom_id, invoice_number, client_id, user_id, date, subtotal, tax_rate, tax_amount, discount, total, status, payment_method) 
                                        VALUES (:custom_id, :invoice_number, :client_id, :user_id, CURRENT_DATE(), :subtotal, :tax_rate, :tax_amount, :discount, :total, 'Cobrada', :payment_method)");
                $stmt->execute([
                    'custom_id' => $custom_id,
                    'invoice_number' => $invoice_number,
                    'client_id' => $client_id,
                    'user_id' => $_SESSION['user_id'],
                    'subtotal' => $subtotal,
                    'tax_rate' => $tax_rate,
                    'tax_amount' => $tax_amount,
                    'discount' => $discount,
                    'total' => $total,
                    'payment_method' => $payment_method
                ]);
                $invoiceId = $pdo->lastInsertId();

                // Procesar ítems y descontar stock
                $stmtItem = $pdo->prepare("INSERT INTO invoice_items (invoice_id, product_id, qty, price) VALUES (:invoice_id, :product_id, :qty, :price)");
                $stmtStock = $pdo->prepare("UPDATE products SET stock = stock - :qty WHERE id = :product_id");
                $stmtLogStock = $pdo->prepare("INSERT INTO inventory_movements (custom_id, product_id, qty, type, reason, date, user_id) 
                                               VALUES (:custom_id, :product_id, :qty, 'Salida', :reason, CURRENT_DATE(), :user_id)");

                foreach ($items as $index => $item) {
                    $prod_id = intval($item['product_id']);
                    $qty = intval($item['qty']);
                    $price = floatval($item['price']);

                    // Validar stock disponible
                    $stmtCheck = $pdo->prepare("SELECT stock, name, min_stock FROM products WHERE id = :id");
                    $stmtCheck->execute(['id' => $prod_id]);
                    $prod = $stmtCheck->fetch();
                    if (!$prod) {
                        throw new Exception("Producto no encontrado (ID: $prod_id).");
                    }
                    if ($prod['stock'] < $qty) {
                        throw new Exception("Stock insuficiente para el producto: " . $prod['name'] . ". Stock actual: " . $prod['stock']);
                    }

                    // Insertar ítem de factura
                    $stmtItem->execute([
                        'invoice_id' => $invoiceId,
                        'product_id' => $prod_id,
                        'qty' => $qty,
                        'price' => $price
                    ]);

                    // Descontar stock
                    $stmtStock->execute([
                        'qty' => $qty,
                        'product_id' => $prod_id
                    ]);

                    // Actualizar estado del producto
                    $newStock = $prod['stock'] - $qty;
                    $newStatus = 'Disponible';
                    if ($newStock <= 0) {
                        $newStatus = 'Agotado';
                    } elseif ($newStock <= $prod['min_stock']) {
                        $newStatus = 'Bajo Stock';
                    }
                    $stmtUpdateStatus = $pdo->prepare("UPDATE products SET status = :status WHERE id = :id");
                    $stmtUpdateStatus->execute(['status' => $newStatus, 'id' => $prod_id]);

                    // Log de movimiento de inventario
                    $mov_custom_id = "MOV-" . ($maxId * 10 + $index + 5000);
                    $stmtLogStock->execute([
                        'custom_id' => $mov_custom_id,
                        'product_id' => $prod_id,
                        'qty' => $qty,
                        'reason' => "Venta Factura $invoice_number",
                        'user_id' => $_SESSION['user_id']
                    ]);
                }

                logAudit($pdo, 'INVOICE_CREATE', 'invoices', $invoiceId, "Se emitió la factura $invoice_number por un total de $total €.");
                $pdo->commit();
                jsonResponse(true, ['id' => $invoiceId, 'invoice_number' => $invoice_number], 'Factura creada y stock actualizado.');
            } catch (Exception $e) {
                $pdo->rollBack();
                jsonResponse(false, null, 'Error al procesar la venta: ' . $e->getMessage());
            }
            break;

        case 'get_audit_logs':
            $stmt = $pdo->query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100");
            $logs = $stmt->fetchAll();
            jsonResponse(true, $logs);
            break;

        case 'get_settings':
            $stmt = $pdo->query("SELECT * FROM settings WHERE id = 1");
            $settings = $stmt->fetch();
            if (!$settings) {
                // Insertar por defecto si no existe
                $pdo->query("INSERT INTO settings (id, company_name, cif, tax_rate, currency) VALUES (1, 'Anaya Outlet S.L.', 'B-87654321', 21, '€')");
                $stmt = $pdo->query("SELECT * FROM settings WHERE id = 1");
                $settings = $stmt->fetch();
            }
            jsonResponse(true, $settings);
            break;

        case 'save_settings':
            $company_name = trim($inputData['company_name'] ?? '');
            $cif = trim($inputData['cif'] ?? '');
            $phone = trim($inputData['phone'] ?? null);
            $email = trim($inputData['email'] ?? null);
            $address = trim($inputData['address'] ?? null);
            $city = trim($inputData['city'] ?? null);
            $state = trim($inputData['state'] ?? null);
            $tax_rate = intval($inputData['tax_rate'] ?? 21);
            $currency = trim($inputData['currency'] ?? '€');

            if (empty($company_name) || empty($cif)) {
                jsonResponse(false, null, 'El nombre de empresa y CIF son obligatorios.');
            }

            $stmt = $pdo->prepare("UPDATE settings SET company_name = :company_name, cif = :cif, phone = :phone, 
                                    email = :email, address = :address, city = :city, state = :state, 
                                    tax_rate = :tax_rate, currency = :currency WHERE id = 1");
            $stmt->execute([
                'company_name' => $company_name, 'cif' => $cif, 'phone' => $phone,
                'email' => $email, 'address' => $address, 'city' => $city, 'state' => $state,
                'tax_rate' => $tax_rate, 'currency' => $currency
            ]);

            logAudit($pdo, 'SETTINGS_UPDATE', 'settings', 1, "Se actualizó la configuración de la empresa.");
            jsonResponse(true, null, 'Configuración actualizada con éxito.');
            break;

        default:
            jsonResponse(false, null, 'Acción no soportada.');
            break;
    }
} catch (Exception $e) {
    jsonResponse(false, null, 'Error del servidor: ' . $e->getMessage());
}
?>
