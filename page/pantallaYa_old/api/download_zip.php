<?php
require_once 'db.php';

// Verificar autenticación
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo "Acceso denegado. Inicia sesión.";
    exit;
}

$userId = $_SESSION['user_id'];
$userRole = $_SESSION['user_role'] ?? 'user';
$campId = $_GET['camp'] ?? null;

if (!$campId) {
    http_response_code(400);
    echo "ID de campaña requerido.";
    exit;
}

try {
    // Verificar que la campaña exista
    $stmt = $pdo->prepare("SELECT nombre, user_id FROM campanas WHERE id = ?");
    $stmt->execute([$campId]);
    $camp = $stmt->fetch();

    if (!$camp) {
        http_response_code(404);
        echo "Campaña no encontrada.";
        exit;
    }

    // Verificar pertenencia (salvo que sea admin)
    if ($camp['user_id'] != $userId && $userRole !== 'admin') {
        http_response_code(403);
        echo "Acceso denegado. No tienes permisos sobre esta campaña.";
        exit;
    }

    // Obtener los archivos de la campaña
    $stmtFiles = $pdo->prepare("SELECT file_name, file_path FROM archivos WHERE campana_id = ?");
    $stmtFiles->execute([$campId]);
    $files = $stmtFiles->fetchAll();

    if (empty($files)) {
        http_response_code(400);
        echo "Esta campaña no tiene archivos para descargar.";
        exit;
    }

    // Crear el archivo ZIP temporal
    $zip = new ZipArchive();
    $zipName = tempnam(sys_get_temp_dir(), 'zip');

    if ($zip->open($zipName, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== TRUE) {
        http_response_code(500);
        echo "Error al crear el empaque temporal ZIP.";
        exit;
    }

    $addedFiles = 0;
    foreach ($files as $file) {
        $filePath = '../' . $file['file_path'];
        if (file_exists($filePath)) {
            $zip->addFile($filePath, $file['file_name']);
            $addedFiles++;
        }
    }

    $zip->close();

    if ($addedFiles === 0) {
        http_response_code(400);
        echo "Los archivos asociados no existen físicamente en el servidor.";
        @unlink($zipName);
        exit;
    }

    // Nombre sugerido para la descarga
    $safeCampName = preg_replace('/[^a-zA-Z0-9_.-]/', '_', $camp['nombre']);
    $downloadName = 'campana_' . $safeCampName . '_archivos.zip';

    // Cabeceras HTTP de descarga
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $downloadName . '"');
    header('Content-Length: ' . filesize($zipName));
    header('Pragma: no-cache');
    header('Expires: 0');

    // Limpiar búferes de salida
    if (ob_get_level()) {
        ob_end_clean();
    }

    // Stream del archivo y remoción temporal
    readfile($zipName);
    @unlink($zipName);
    exit;

} catch (Exception $e) {
    http_response_code(500);
    echo "Error interno al generar el ZIP: " . $e->getMessage();
}
