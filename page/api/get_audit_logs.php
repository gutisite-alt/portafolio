<?php
// ============================================================
// OBTENER REGISTROS DE AUDITORÍA (GET) — ANAYA ERP
// ============================================================

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');

// Verificar sesión activa y rol de administrador (la auditoría es estrictamente confidencial)
if (!isset($_SESSION['loggedIn']) || $_SESSION['loggedIn'] !== true || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado. Permisos de administrador requeridos.']);
    exit;
}

require_once '../config/db_connect.php';

// Parámetros de paginación y filtros
$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$limit = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 15;
$offset = ($page - 1) * $limit;

$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$actionFilter = isset($_GET['actionFilter']) ? trim($_GET['actionFilter']) : '';

try {
    // 1. Construir las cláusulas WHERE de búsqueda
    $whereClauses = [];
    $params = [];

    if (!empty($search)) {
        $whereClauses[] = "(user_name LIKE :search OR description LIKE :search OR action LIKE :search)";
        $params['search'] = '%' . $search . '%';
    }

    if (!empty($actionFilter)) {
        $whereClauses[] = "action = :actionFilter";
        $params['actionFilter'] = $actionFilter;
    }

    $whereSQL = '';
    if (!empty($whereClauses)) {
        $whereSQL = 'WHERE ' . implode(' AND ', $whereClauses);
    }

    // 2. Obtener el total de registros para el paginador
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM audit_logs $whereSQL");
    $countStmt->execute($params);
    $totalLogs = intval($countStmt->fetchColumn());

    // 3. Obtener los logs de la página actual (orden descendente)
    $querySQL = "
        SELECT id, user_id, user_name, action, table_name, record_id, description, ip_address, created_at 
        FROM audit_logs 
        $whereSQL 
        ORDER BY id DESC 
        LIMIT :limit OFFSET :offset
    ";

    $stmt = $pdo->prepare($querySQL);
    
    // Vincular limit y offset como enteros debido a emulación de prepares
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    
    // Vincular los demás parámetros de búsqueda
    foreach ($params as $key => $val) {
        $stmt->bindValue(':' . $key, $val);
    }

    $stmt->execute();
    $logs = $stmt->fetchAll();

    // 4. Obtener las distintas acciones registradas para poblar el dropdown de filtro
    $actionsStmt = $pdo->query("SELECT DISTINCT action FROM audit_logs ORDER BY action ASC");
    $availableActions = $actionsStmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode([
        'success' => true,
        'logs' => $logs,
        'total' => $totalLogs,
        'page' => $page,
        'limit' => $limit,
        'availableActions' => $availableActions
    ]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al obtener registros de auditoría: ' . $e->getMessage()]);
}
?>
