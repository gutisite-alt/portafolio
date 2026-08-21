<?php
// ============================================================
// OBTENER HISTÓRICO DE ARQUEOS Y SESIONES DE CAJA (GET) — ANAYA ERP
// ============================================================

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');

// Verificar sesión activa
if (!isset($_SESSION['loggedIn']) || $_SESSION['loggedIn'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado. Inicie sesión.']);
    exit;
}

require_once '../config/db_connect.php';

// Parámetros de paginación y filtros
$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$limit = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 10;
$offset = ($page - 1) * $limit;

$startDate = isset($_GET['startDate']) ? trim($_GET['startDate']) : '';
$endDate = isset($_GET['endDate']) ? trim($_GET['endDate']) : '';

try {
    // 1. Construir las cláusulas WHERE de búsqueda
    $whereClauses = [];
    $params = [];

    // Solo mostrar sesiones cerradas para auditoría (o todas, pero ordenadas por fecha)
    // El usuario quiere el histórico, mostremos las cerradas por defecto o todas
    if (!empty($startDate)) {
        $whereClauses[] = "DATE(opening_date) >= :startDate";
        $params['startDate'] = $startDate;
    }

    if (!empty($endDate)) {
        $whereClauses[] = "DATE(opening_date) <= :endDate";
        $params['endDate'] = $endDate;
    }

    $whereSQL = '';
    if (!empty($whereClauses)) {
        $whereSQL = 'WHERE ' . implode(' AND ', $whereClauses);
    }

    // 2. Obtener el total de registros para el paginador
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM cash_sessions $whereSQL");
    $countStmt->execute($params);
    $totalSessions = intval($countStmt->fetchColumn());

    // 3. Obtener las sesiones de caja (orden descendente)
    $querySQL = "
        SELECT s.*, UNIX_TIMESTAMP(s.opening_date) AS opening_date_unix, UNIX_TIMESTAMP(s.closing_date) AS closing_date_unix, u.name AS user_name 
        FROM cash_sessions s
        JOIN users u ON s.user_id = u.id
        $whereSQL 
        ORDER BY s.id DESC 
        LIMIT :limit OFFSET :offset
    ";

    $stmt = $pdo->prepare($querySQL);
    
    // Bind integer offsets
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    foreach ($params as $key => $val) {
        $stmt->bindValue(':' . $key, $val);
    }
    
    $stmt->execute();
    $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $formattedSessions = [];
    foreach ($sessions as $s) {
        $s['opening_date'] = $s['opening_date_unix'] ? gmdate('Y-m-d\TH:i:s\Z', $s['opening_date_unix']) : null;
        $s['closing_date'] = $s['closing_date_unix'] ? gmdate('Y-m-d\TH:i:s\Z', $s['closing_date_unix']) : null;
        $formattedSessions[] = $s;
    }

    echo json_encode([
        'success' => true,
        'sessions' => $formattedSessions,
        'total' => $totalSessions,
        'page' => $page,
        'limit' => $limit
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al consultar histórico de caja: ' . $e->getMessage()]);
}
?>
