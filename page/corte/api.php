<?php
require_once 'config.php';

// Habilitar CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Manejar preflight request (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Consultar todos los cortes y sus hojas imperfectas
            $sql = "SELECT c.id, c.fecha, c.pliegos, c.motivo, c.observacion, h.indice_hoja 
                    FROM cortes c 
                    LEFT JOIN hojas_imperfectas h ON c.id = h.corte_id 
                    ORDER BY c.fecha DESC, c.creado_en DESC";
            
            $stmt = $pdo->query($sql);
            $raw_results = $stmt->fetchAll();
            
            // Agrupar los resultados para estructurar el JSON esperado
            $records = [];
            foreach ($raw_results as $row) {
                $id = $row['id'];
                if (!isset($records[$id])) {
                    $records[$id] = [
                        'id' => $row['id'],
                        'date' => $row['fecha'],
                        'sheets' => (float)$row['pliegos'],
                        'damaged' => [],
                        'reason' => $row['motivo'] ?? '',
                        'note' => $row['observacion'] ?? ''
                    ];
                }
                if ($row['indice_hoja'] !== null) {
                    $records[$id]['damaged'][] = (int)$row['indice_hoja'];
                }
            }
            
            // Re-indexar el array para devolver una lista limpia en JSON
            echo json_encode(array_values($records), JSON_UNESCAPED_UNICODE);
            break;
            
        case 'POST':
            // Leer el cuerpo de la petición (JSON)
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || empty($input['id']) || empty($input['date']) || !isset($input['sheets'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Datos incompletos o inválidos']);
                exit;
            }
            
            // Iniciar transacción para garantizar consistencia
            $pdo->beginTransaction();
            
            // Insertar registro del corte
            $stmt = $pdo->prepare("INSERT INTO cortes (id, fecha, pliegos, motivo, observacion) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $input['id'],
                $input['date'],
                (float)$input['sheets'],
                !empty($input['reason']) ? $input['reason'] : null,
                !empty($input['note']) ? $input['note'] : null
            ]);
            
            // Insertar hojas imperfectas (si las hay)
            if (!empty($input['damaged']) && is_array($input['damaged'])) {
                $stmt_damaged = $pdo->prepare("INSERT INTO hojas_imperfectas (corte_id, indice_hoja) VALUES (?, ?)");
                foreach ($input['damaged'] as $indice) {
                    $stmt_damaged->execute([$input['id'], (int)$indice]);
                }
            }
            
            $pdo->commit();
            
            echo json_encode(['success' => true, 'message' => 'Registro guardado con éxito']);
            break;
            
        case 'DELETE':
            // Obtener el ID del corte a eliminar desde la query string
            if (empty($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID no proporcionado']);
                exit;
            }
            
            $id = $_GET['id'];
            
            // Eliminar corte (se eliminan las hojas imperfectas en cascada automáticamente)
            $stmt = $pdo->prepare("DELETE FROM cortes WHERE id = ?");
            $stmt->execute([$id]);
            
            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true, 'message' => 'Registro eliminado con éxito']);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Registro no encontrado']);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método HTTP no permitido']);
            break;
    }
} catch (\Exception $e) {
    // Si la transacción está activa, hacer rollback
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'error' => 'Error en el servidor: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
