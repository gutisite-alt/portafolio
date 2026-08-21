<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Verificar autenticación o permitir auto-registro desde la landing
if (!isset($_SESSION['user_id'])) {
    if ($method === 'POST' && !empty($input['user_email']) && !empty($input['user_nombre'])) {
        $email = trim($input['user_email']);
        $nombre = trim($input['user_nombre']);
        $telefono = trim($input['user_telefono'] ?? '');
        $documento = trim($input['user_documento'] ?? '');
        
        try {
            // Verificar si el usuario ya existe
            $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
            $stmt->execute([$email]);
            $existingId = $stmt->fetchColumn();
            
            if ($existingId) {
                $userId = $existingId;
            } else {
                // Crear nuevo usuario (con contraseña por defecto '123456' o número de documento si existe)
                $passPlain = !empty($documento) ? $documento : '123456';
                $password_hash = password_hash($passPlain, PASSWORD_BCRYPT);
                
                // Insertar usuario
                $stmt = $pdo->prepare("
                    INSERT INTO usuarios (nombre, email, password_hash, rol, limite_pantallas, estado) 
                    VALUES (?, ?, ?, 'cliente', 5, 'activo')
                ");
                $stmt->execute([$nombre, $email, $password_hash]);
                $userId = $pdo->lastInsertId();
            }
            
            // Iniciar sesión
            $_SESSION['user_id'] = $userId;
            $_SESSION['user_email'] = $email;
            $_SESSION['user_nombre'] = $nombre;
            
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al registrar usuario: ' . $e->getMessage()
            ]);
            exit;
        }
    } else {
        http_response_code(401);
        echo json_encode([
            'error' => true,
            'message' => 'Sesión no iniciada. Acceso denegado.'
        ]);
        exit;
    }
} else {
    $userId = $_SESSION['user_id'];
}

$action = $_POST['action'] ?? $_GET['action'] ?? $input['action'] ?? '';
if ($method === 'POST' && $action === 'delete') {
    $method = 'DELETE';
}

switch ($method) {
    case 'GET':
        try {
            // Obtener todas las campañas del usuario autenticado
            $stmt = $pdo->prepare("SELECT * FROM campanas WHERE user_id = ? ORDER BY created_at DESC");
            $stmt->execute([$userId]);
            $campanas = $stmt->fetchAll();

            // Para cada campaña, obtener sus archivos asociados
            foreach ($campanas as &$c) {
                $stmtFiles = $pdo->prepare("SELECT id, file_name AS name, file_path AS url, file_size AS size, file_type AS type FROM archivos WHERE campana_id = ?");
                $stmtFiles->execute([$c['id']]);
                $c['archivos'] = $stmtFiles->fetchAll();
            }

            echo json_encode([
                'success' => true,
                'campanas' => $campanas
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al obtener campañas: ' . $e->getMessage()
            ]);
        }
        break;

    case 'POST':
        // Crear campaña
        $nombre = trim($input['nombre'] ?? '');
        $edificio = trim($input['edificio'] ?? '');
        $plan = trim($input['plan'] ?? 'Emprendedor');
        $direccion = trim($input['direccion'] ?? '');
        $torre = trim($input['torre'] ?? '');
        $bloque = trim($input['bloque'] ?? '');
        $observaciones = trim($input['observaciones'] ?? '');
        $pago_metodo = trim($input['pago_metodo'] ?? 'tc');

        if (empty($nombre) || empty($edificio) || empty($direccion)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Nombre, edificio y dirección son campos obligatorios.'
            ]);
            exit;
        }

        try {
            $stmt = $pdo->prepare("
                INSERT INTO campanas (user_id, nombre, edificio, plan, direccion, torre, bloque, observaciones, pago_metodo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $userId,
                $nombre,
                $edificio,
                $plan,
                $direccion,
                $torre,
                $bloque,
                $observaciones,
                $pago_metodo
            ]);

            $newId = $pdo->lastInsertId();

            echo json_encode([
                'success' => true,
                'message' => 'Campaña creada exitosamente.',
                'campana_id' => $newId
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al guardar la campaña: ' . $e->getMessage()
            ]);
        }
        break;

    case 'DELETE':
        // Eliminar campaña
        $campId = $input['id'] ?? $_GET['id'] ?? null;

        if (!$campId) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'ID de campaña no provisto.'
            ]);
            exit;
        }

        try {
            // Verificar pertenencia de la campaña antes de borrar
            $stmt = $pdo->prepare("SELECT id FROM campanas WHERE id = ? AND user_id = ?");
            $stmt->execute([$campId, $userId]);
            $camp = $stmt->fetch();

            if (!$camp) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'No tienes permisos para eliminar esta campaña.'
                ]);
                exit;
            }

            // Obtener todos los archivos asociados para borrarlos físicamente del disco
            $stmtFiles = $pdo->prepare("SELECT file_path FROM archivos WHERE campana_id = ?");
            $stmtFiles->execute([$campId]);
            $files = $stmtFiles->fetchAll();

            foreach ($files as $file) {
                // El path está relativo a la API, p.ej. 'uploads/camp_123/archivo.png'
                // Subir un nivel para llegar a la raíz si el script corre en 'api/'
                $physicalPath = '../' . $file['file_path'];
                if (file_exists($physicalPath)) {
                    unlink($physicalPath);
                }
            }

            // Borrar directorio de la campaña si queda vacío
            $campDir = '../uploads/camp_' . $campId;
            if (is_dir($campDir)) {
                @rmdir($campDir);
            }

            // Eliminar de la base de datos (ON DELETE CASCADE borrará las tuplas de la tabla archivos)
            $stmtDelete = $pdo->prepare("DELETE FROM campanas WHERE id = ?");
            $stmtDelete->execute([$campId]);

            echo json_encode([
                'success' => true,
                'message' => 'Campaña y archivos asociados eliminados correctamente.'
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al eliminar campaña: ' . $e->getMessage()
            ]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'message' => 'Método HTTP no permitido.'
        ]);
        break;
}
exit;
