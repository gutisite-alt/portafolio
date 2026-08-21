<?php
require_once 'db.php';

// Verificar autenticación
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Sesión no iniciada.'
    ]);
    exit;
}

// Ejecutar alteraciones automáticas en la tabla usuarios si no existen los campos extendidos
try {
    $pdo->query("SELECT estado, limite_pantallas, avatar_theme FROM usuarios LIMIT 1");
} catch (Exception $e) {
    try {
        $pdo->exec("ALTER TABLE usuarios ADD COLUMN estado VARCHAR(20) DEFAULT 'activo'");
        $pdo->exec("ALTER TABLE usuarios ADD COLUMN limite_pantallas INT DEFAULT 5");
        $pdo->exec("ALTER TABLE usuarios ADD COLUMN avatar_theme VARCHAR(20) DEFAULT 'blue'");
    } catch (Exception $alterEx) {
        // Ignorar si ya existiesen en otra variante
    }
}

// Asegurar que exista al menos un administrador si hay usuarios.
// Si no hay administradores en la base de datos, hacemos que el primer usuario registrado sea administrador.
try {
    $stmtCount = $pdo->query("SELECT COUNT(*) FROM usuarios WHERE rol = 'admin'");
    if ($stmtCount->fetchColumn() == 0) {
        $pdo->exec("UPDATE usuarios SET rol = 'admin' ORDER BY id ASC LIMIT 1");
    }
} catch (Exception $e) {
    // Ignorar si falla
}

// Consultar el rol del usuario actual desde la base de datos para verificar permisos de administrador
$userId = $_SESSION['user_id'];
try {
    $stmt = $pdo->prepare("SELECT rol FROM usuarios WHERE id = ?");
    $stmt->execute([$userId]);
    $userRol = $stmt->fetchColumn();
} catch (PDOException $e) {
    $userRol = '';
}

if ($userRol !== 'admin') {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Acceso denegado. Se requieren permisos de administrador.'
    ]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $_POST['action'] ?? $_GET['action'] ?? $input['action'] ?? '';

// Emulación de DELETE / PUT / PATCH para hosting limitados
if ($method === 'POST') {
    if ($action === 'delete') {
        $method = 'DELETE';
    } else if ($action === 'update') {
        $method = 'PUT';
    } else if ($action === 'toggle_status') {
        $method = 'PATCH';
    }
}

switch ($method) {
    case 'GET':
        try {
            $stmt = $pdo->query("
                SELECT u.id, u.nombre, u.email, u.rol, u.estado, u.limite_pantallas AS limite, u.avatar_theme AS theme,
                       (SELECT COUNT(*) FROM campanas WHERE user_id = u.id) AS pantallas,
                       IFNULL((SELECT SUM(a.file_size) FROM archivos a JOIN campanas c ON a.campana_id = c.id WHERE c.user_id = u.id), 0) AS storage_bytes
                FROM usuarios u
                ORDER BY u.created_at DESC
            ");
            $users = $stmt->fetchAll();

            // Formatear almacenamiento e iniciales
            foreach ($users as &$u) {
                $bytes = (int)$u['storage_bytes'];
                if ($bytes >= 1073741824) {
                    $u['storage'] = round($bytes / 1073741824, 1) . ' GB';
                } elseif ($bytes >= 1048576) {
                    $u['storage'] = round($bytes / 1048576, 1) . ' MB';
                } elseif ($bytes >= 1024) {
                    $u['storage'] = round($bytes / 1024, 1) . ' KB';
                } else {
                    $u['storage'] = $bytes . ' B';
                }
                unset($u['storage_bytes']);

                // Iniciales del nombre
                $palabras = explode(' ', trim($u['nombre']));
                $initials = '';
                if (count($palabras) >= 2) {
                    $initials = substr($palabras[0], 0, 1) . substr($palabras[1], 0, 1);
                } else {
                    $initials = substr($u['nombre'], 0, 2);
                }
                $u['initials'] = strtoupper($initials);
            }

            echo json_encode([
                'success' => true,
                'clientes' => $users
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al obtener clientes: ' . $e->getMessage()
            ]);
        }
        break;

    case 'POST':
        // Crear nuevo cliente
        $nombre = trim($input['nombre'] ?? '');
        $email = trim($input['email'] ?? '');
        $limite = (int)($input['limite'] ?? 5);
        $theme = trim($input['theme'] ?? 'blue');
        
        if (empty($nombre) || empty($email)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Nombre y correo son obligatorios.']);
            exit;
        }

        try {
            // Hash de contraseña por defecto: 123456
            $passHash = password_hash('123456', PASSWORD_BCRYPT);
            
            $stmt = $pdo->prepare("
                INSERT INTO usuarios (nombre, email, password, rol, estado, limite_pantallas, avatar_theme)
                VALUES (?, ?, ?, 'user', 'activo', ?, ?)
            ");
            $stmt->execute([$nombre, $email, $passHash, $limite, $theme]);

            echo json_encode([
                'success' => true,
                'message' => 'Cliente creado con éxito. Contraseña temporal por defecto: 123456'
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al crear el cliente: ' . $e->getMessage()
            ]);
        }
        break;

    case 'PUT':
        // Editar cliente existente
        $id = $input['id'] ?? null;
        $nombre = trim($input['nombre'] ?? '');
        $email = trim($input['email'] ?? '');
        $limite = (int)($input['limite'] ?? 5);
        $theme = trim($input['theme'] ?? 'blue');

        if (!$id || empty($nombre) || empty($email)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Datos insuficientes para actualizar.']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("
                UPDATE usuarios 
                SET nombre = ?, email = ?, limite_pantallas = ?, avatar_theme = ?
                WHERE id = ?
            ");
            $stmt->execute([$nombre, $email, $limite, $theme, $id]);

            echo json_encode([
                'success' => true,
                'message' => 'Cliente actualizado correctamente.'
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al actualizar el cliente: ' . $e->getMessage()
            ]);
        }
        break;

    case 'PATCH':
        // Alternar estado activo / suspendido
        $id = $input['id'] ?? $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de cliente no provisto.']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("
                UPDATE usuarios 
                SET estado = CASE WHEN estado = 'activo' THEN 'suspendido' ELSE 'activo' END
                WHERE id = ?
            ");
            $stmt->execute([$id]);

            echo json_encode([
                'success' => true,
                'message' => 'Estado del cliente actualizado con éxito.'
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al alternar estado: ' . $e->getMessage()
            ]);
        }
        break;

    case 'DELETE':
        // Eliminar cliente
        $id = $input['id'] ?? $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de cliente no provisto.']);
            exit;
        }

        try {
            // Primero borrar los archivos de todas las campañas del usuario
            $stmtFiles = $pdo->prepare("
                SELECT a.file_path FROM archivos a 
                JOIN campanas c ON a.campana_id = c.id 
                WHERE c.user_id = ?
            ");
            $stmtFiles->execute([$id]);
            $files = $stmtFiles->fetchAll();
            foreach ($files as $file) {
                $physicalPath = '../' . $file['file_path'];
                if (file_exists($physicalPath)) {
                    unlink($physicalPath);
                }
            }

            // Eliminar usuario. Cascade delete borrará campañas y archivos de la BD
            $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id = ?");
            $stmt->execute([$id]);

            echo json_encode([
                'success' => true,
                'message' => 'Cliente y todos sus recursos eliminados correctamente.'
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al eliminar cliente: ' . $e->getMessage()
            ]);
        }
        break;
}
