<?php
require_once 'db.php';

// Evitar almacenamiento en caché
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

// Crear tabla de planes automáticamente si no existe y poblarla con los planes por defecto
try {
    $pdo->query("SELECT 1 FROM planes LIMIT 1");
} catch (Exception $e) {
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS planes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(50) NOT NULL,
                precio DECIMAL(10,2) NOT NULL,
                periodo VARCHAR(20) DEFAULT 'mes',
                popular TINYINT(1) DEFAULT 0,
                limite_pantallas INT DEFAULT 5,
                caracteristicas TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");

        // Poblar planes iniciales
        $stmt = $pdo->prepare("
            INSERT INTO planes (nombre, precio, periodo, popular, limite_pantallas, caracteristicas)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $plans = [
            [
                'Emprendedor', 
                49000.00, 
                'mes', 
                0, 
                1, 
                json_encode(["1 anuncio en rotación", "1 edificio a tu elección", "Soporte por WhatsApp"], JSON_UNESCAPED_UNICODE)
            ],
            [
                'Plan Negocio', 
                99000.00, 
                'mes', 
                1, 
                3, 
                json_encode(["Hasta 3 anuncios rotativos", "Presencia en 3 edificios cercanos", "Mayor frecuencia de aparición", "Reporte de métricas mensual"], JSON_UNESCAPED_UNICODE)
            ],
            [
                'Plan Premium', 
                199000.00, 
                'mes', 
                0, 
                10, 
                json_encode(["Cambios de anuncio ilimitados", "Presencia en hasta 10 edificios", "Rotación prioritaria (VIP)", "Diseño gráfico del anuncio incluido"], JSON_UNESCAPED_UNICODE)
            ]
        ];

        foreach ($plans as $p) {
            $stmt->execute($p);
        }
    } catch (Exception $initEx) {
        // Ignorar si falla
    }
}

$method = $_SERVER['REQUEST_METHOD'];

// Para GET, permitimos acceso público (para la landing page y el asistente)
if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM planes ORDER BY precio ASC");
        $planes = $stmt->fetchAll();
        
        // Decodificar características
        foreach ($planes as &$p) {
            $p['caracteristicas'] = json_decode($p['caracteristicas'] ?? '[]', true);
            $p['precio'] = (float)$p['precio'];
            $p['popular'] = (int)$p['popular'];
            $p['limite_pantallas'] = (int)$p['limite_pantallas'];
        }

        echo json_encode([
            'success' => true,
            'planes' => $planes
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al obtener planes: ' . $e->getMessage()
        ]);
    }
    exit;
}

// Para POST, PUT, DELETE se requiere autenticación de administrador
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Sesión no iniciada.'
    ]);
    exit;
}

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

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $_POST['action'] ?? $_GET['action'] ?? $input['action'] ?? '';

if ($method === 'POST') {
    if ($action === 'delete') {
        $method = 'DELETE';
    } else if ($action === 'update') {
        $method = 'PUT';
    }
}

switch ($method) {
    case 'POST':
        // Crear nuevo plan
        $nombre = trim($input['nombre'] ?? '');
        $precio = (float)($input['precio'] ?? 0);
        $periodo = trim($input['periodo'] ?? 'mes');
        $popular = (int)($input['popular'] ?? 0);
        $limite_pantallas = (int)($input['limite_pantallas'] ?? 5);
        $caracteristicas = $input['caracteristicas'] ?? []; // Esperamos un array

        if (empty($nombre) || $precio < 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Nombre y precio válidos son obligatorios.']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("
                INSERT INTO planes (nombre, precio, periodo, popular, limite_pantallas, caracteristicas)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $nombre,
                $precio,
                $periodo,
                $popular,
                $limite_pantallas,
                json_encode($caracteristicas, JSON_UNESCAPED_UNICODE)
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Plan creado con éxito.'
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al crear el plan: ' . $e->getMessage()
            ]);
        }
        break;

    case 'PUT':
        // Editar plan
        $id = $input['id'] ?? null;
        $nombre = trim($input['nombre'] ?? '');
        $precio = (float)($input['precio'] ?? 0);
        $periodo = trim($input['periodo'] ?? 'mes');
        $popular = (int)($input['popular'] ?? 0);
        $limite_pantallas = (int)($input['limite_pantallas'] ?? 5);
        $caracteristicas = $input['caracteristicas'] ?? [];

        if (!$id || empty($nombre) || $precio < 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Datos insuficientes para actualizar el plan.']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("
                UPDATE planes 
                SET nombre = ?, precio = ?, periodo = ?, popular = ?, limite_pantallas = ?, caracteristicas = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $nombre,
                $precio,
                $periodo,
                $popular,
                $limite_pantallas,
                json_encode($caracteristicas, JSON_UNESCAPED_UNICODE),
                $id
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Plan actualizado correctamente.'
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al actualizar el plan: ' . $e->getMessage()
            ]);
        }
        break;

    case 'DELETE':
        // Eliminar plan
        $id = $input['id'] ?? $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de plan no provisto.']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM planes WHERE id = ?");
            $stmt->execute([$id]);

            echo json_encode([
                'success' => true,
                'message' => 'Plan eliminado correctamente.'
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al eliminar el plan: ' . $e->getMessage()
            ]);
        }
        break;
}
