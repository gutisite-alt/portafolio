<?php
// ============================================================
// OBTENER DATOS PÚBLICOS DE LA TIENDA (GET)
// ============================================================

header('Content-Type: application/json; charset=utf-8');

// Desactivar caché para obtener datos frescos de stock
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

// Incluir conexión a la base de datos (con path relativo al directorio tienda)
require_once '../../config/db_connect.php';

try {
    // 1. Obtener la configuración básica de la tienda (Nombre de empresa, CIF, Moneda)
    $settingsStmt = $pdo->query('SELECT company_name, CIF, phone, email, address, city, state, currency FROM settings LIMIT 1');
    $settings = $settingsStmt->fetch();
    
    if (!$settings) {
        // Valores por defecto si la tabla está vacía
        $settings = [
            'company_name' => 'Anaya Outlet S.L.',
            'CIF' => 'B-87654321',
            'phone' => '+34 910 123 456',
            'email' => 'contacto@anayaoutlet.com',
            'address' => 'Calle Mayor 124, Polígono Industrial Oeste',
            'city' => 'Madrid',
            'state' => 'Madrid',
            'currency' => '€'
        ];
    }

    // 2. Obtener categorías
    $categoriesStmt = $pdo->query('SELECT id, name FROM categories ORDER BY name ASC');
    $categories = $categoriesStmt->fetchAll();

    // 3. Obtener marcas
    $brandsStmt = $pdo->query('SELECT id, name FROM brands ORDER BY name ASC');
    $brands = $brandsStmt->fetchAll();

    // 4. Obtener productos (solo información no sensible de cara al cliente)
    // Se excluye 'buy_price' y 'supplier_id'
    $productsStmt = $pdo->query('
        SELECT 
            id, 
            sku, 
            name, 
            brand, 
            category, 
            sell_price, 
            stock, 
            image_url, 
            description, 
            status 
        FROM products 
        ORDER BY id DESC
    ');
    $products = $productsStmt->fetchAll();

    // Responder con estructura unificada
    echo json_encode([
        'success' => true,
        'settings' => $settings,
        'categories' => $categories,
        'brands' => $brands,
        'products' => $products
    ]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al cargar los datos de la tienda: ' . $e->getMessage()
    ]);
}
?>
