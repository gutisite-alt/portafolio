<?php
require_once 'db.php';

// Este endpoint es público para que las tablets en los edificios obtengan su contenido.
$campId = $_GET['camp'] ?? null;

if (!$campId) {
    http_response_code(400);
    echo json_encode([
        'error' => true,
        'message' => 'Falta el parámetro de campaña (?camp=ID).'
    ]);
    exit;
}

try {
    // Buscar la campaña
    $stmt = $pdo->prepare("SELECT id, nombre, edificio, plan FROM campanas WHERE id = ?");
    $stmt->execute([$campId]);
    $camp = $stmt->fetch();

    if (!$camp) {
        http_response_code(404);
        echo json_encode([
            'error' => true,
            'message' => 'Campaña no encontrada.'
        ]);
        exit;
    }

    // Obtener los archivos de la campaña
    $stmtFiles = $pdo->prepare("SELECT id, file_name AS name, file_path AS url, file_size AS size, file_type AS type FROM archivos WHERE campana_id = ?");
    $stmtFiles->execute([$campId]);
    $files = $stmtFiles->fetchAll();

    $camp['archivos'] = $files;

    echo json_encode([
        'success' => true,
        'campana' => $camp
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => 'Error de servidor: ' . $e->getMessage()
    ]);
}
exit;
