<?php
require_once 'db.php';

// Verificar autenticación
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'error' => true,
        'message' => 'Sesión no iniciada. Acceso denegado.'
    ]);
    exit;
}

$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $_POST['action'] ?? $_GET['action'] ?? $input['action'] ?? '';

if ($method === 'POST') {
    if ($action === 'delete') {
        $method = 'DELETE';
    } else if ($action === 'rename') {
        $method = 'PUT';
    }
}

// --- ELIMINAR ARCHIVO (DELETE) ---
if ($method === 'DELETE') {
    $fileId = $input['file_id'] ?? $_GET['file_id'] ?? null;

    if (!$fileId) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'ID de archivo no provisto.'
        ]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("
            SELECT a.id, a.file_path, c.user_id 
            FROM archivos a 
            JOIN campanas c ON a.campana_id = c.id 
            WHERE a.id = ? AND c.user_id = ?
        ");
        $stmt->execute([$fileId, $userId]);
        $file = $stmt->fetch();

        if (!$file) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'No tienes permisos para eliminar este archivo.'
            ]);
            exit;
        }

        $physicalPath = '../' . $file['file_path'];
        if (file_exists($physicalPath)) {
            unlink($physicalPath);
        }

        $stmtDelete = $pdo->prepare("DELETE FROM archivos WHERE id = ?");
        $stmtDelete->execute([$fileId]);

        echo json_encode([
            'success' => true,
            'message' => 'Archivo eliminado correctamente.'
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al eliminar archivo: ' . $e->getMessage()
        ]);
    }
    exit;
}

// --- RENOMBRAR ARCHIVO (PUT) ---
if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $fileId = $input['file_id'] ?? null;
    $newName = trim($input['new_name'] ?? '');

    if (!$fileId || empty($newName)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'ID de archivo y nuevo nombre son requeridos.'
        ]);
        exit;
    }

    try {
        // Verificar pertenencia
        $stmt = $pdo->prepare("
            SELECT a.id, c.user_id 
            FROM archivos a 
            JOIN campanas c ON a.campana_id = c.id 
            WHERE a.id = ? AND c.user_id = ?
        ");
        $stmt->execute([$fileId, $userId]);
        if (!$stmt->fetch()) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'No tienes permisos para editar este archivo.'
            ]);
            exit;
        }

        $stmtUpdate = $pdo->prepare("UPDATE archivos SET file_name = ? WHERE id = ?");
        $stmtUpdate->execute([$newName, $fileId]);

        echo json_encode([
            'success' => true,
            'message' => 'Archivo renombrado correctamente.'
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al renombrar archivo: ' . $e->getMessage()
        ]);
    }
    exit;
}

// --- SUBIR ARCHIVO (POST) ---
$campId = $_POST['campana_id'] ?? null;
$input = json_decode(file_get_contents('php://input'), true) ?? [];
if (!$campId) {
    $campId = $input['campana_id'] ?? null;
}

if (!$campId) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'ID de campaña no especificado.'
    ]);
    exit;
}

try {
    // Validar pertenencia de la campaña
    $stmt = $pdo->prepare("SELECT id FROM campanas WHERE id = ? AND user_id = ?");
    $stmt->execute([$campId, $userId]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'No tienes permisos para subir contenido a esta campaña.'
        ]);
        exit;
    }

    $targetDir = '../uploads/camp_' . $campId . '/';
    if (!is_dir($targetDir)) {
        if (!@mkdir($targetDir, 0755, true)) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error: No se pudo crear la carpeta en el servidor. Verifica que el directorio "uploads/" en la raíz tenga permisos de escritura (CHMOD 755 o 777).'
            ]);
            exit;
        }
    }

    // Caso Base64 (Sincronización)
    if (!empty($input['file_base64']) && !empty($input['file_name'])) {
        $fileName = preg_replace('/[^a-zA-Z0-9_.-]/', '_', $input['file_name']);
        $fileSize = $input['file_size'] ?? 0;
        $fileType = $input['file_type'] ?? 'image';

        $base64Data = $input['file_base64'];
        if (preg_match('/^data:([^;]+);base64,(.*)$/', $base64Data, $matches)) {
            $base64Data = $matches[2];
        }

        $decodedData = base64_decode($base64Data);
        if ($decodedData === false) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Datos Base64 inválidos.']);
            exit;
        }

        if ($fileSize === 0) {
            $fileSize = strlen($decodedData);
        }

        $targetFilePath = $targetDir . $fileName;
        file_put_contents($targetFilePath, $decodedData);

        $dbPath = 'uploads/camp_' . $campId . '/' . $fileName;
        $stmtInsert = $pdo->prepare("
            INSERT INTO archivos (campana_id, file_name, file_path, file_size, file_type)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmtInsert->execute([$campId, $fileName, $dbPath, $fileSize, $fileType]);
        $newId = $pdo->lastInsertId();

        echo json_encode([
            'success' => true,
            'message' => 'Archivo sincronizado con éxito.',
            'file' => [
                'id' => $newId,
                'name' => $fileName,
                'url' => $dbPath,
                'size' => $fileSize,
                'type' => $fileType
            ]
        ]);
        exit;
    }

    // Caso estándar $_FILES
    if (!empty($_FILES['file'])) {
        $file = $_FILES['file'];
        $fileName = preg_replace('/[^a-zA-Z0-9_.-]/', '_', basename($file['name']));
        $fileSize = $file['size'];
        $fileType = (isset($file['type']) && strpos($file['type'], 'video/') === 0) ? 'video' : 'image';

        $targetFilePath = $targetDir . $fileName;

        if (move_uploaded_file($file['tmp_name'], $targetFilePath)) {
            $dbPath = 'uploads/camp_' . $campId . '/' . $fileName;
            $stmtInsert = $pdo->prepare("
                INSERT INTO archivos (campana_id, file_name, file_path, file_size, file_type)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmtInsert->execute([$campId, $fileName, $dbPath, $fileSize, $fileType]);
            $newId = $pdo->lastInsertId();

            echo json_encode([
                'success' => true,
                'message' => 'Archivo subido y guardado con éxito.',
                'file' => [
                    'id' => $newId,
                    'name' => $fileName,
                    'url' => $dbPath,
                    'size' => $fileSize,
                    'type' => $fileType
                ]
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error: No se pudo mover el archivo. Verifica que la carpeta "uploads/" tenga permisos de escritura (CHMOD 755 o 777).'
            ]);
        }
        exit;
    }

    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'No se recibió ningún archivo.'
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos en la subida: ' . $e->getMessage()
    ]);
}
exit;
