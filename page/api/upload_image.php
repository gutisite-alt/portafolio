<?php
// ============================================================
// SUBIDA Y COMPRESIÓN DE IMÁGENES (POST) — ANAYA ERP
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

// Permitir solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido. Se requiere POST.']);
    exit;
}

// Verificar si se ha subido un archivo
if (!isset($_FILES['image'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No se recibió ningún archivo de imagen.']);
    exit;
}

$file = $_FILES['image'];

// Validar errores de subida
if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Error al subir el archivo al servidor. Código: ' . $file['error']]);
    exit;
}

// Validar tamaño máximo (5MB)
$maxSize = 5 * 1024 * 1024;
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'La imagen excede el límite de tamaño permitido de 5MB.']);
    exit;
}

// Validar tipo de archivo (solo imágenes JPG, PNG, GIF, WEBP)
$allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
$fileMime = mime_content_type($file['tmp_name']);

if (!in_array($fileMime, $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Formato de archivo no permitido. Solo se aceptan imágenes JPG, PNG, GIF y WEBP.']);
    exit;
}

// Validar que sea una imagen real usando getimagesize
$imageSize = getimagesize($file['tmp_name']);
if ($imageSize === false) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El archivo no es una imagen válida.']);
    exit;
}

// Directorio raíz de cargas
$baseUploadDir = '../uploads';
if (!is_dir($baseUploadDir)) {
    if (!mkdir($baseUploadDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'No se pudo crear la carpeta de descargas en el servidor.']);
        exit;
    }
}

// Generar una subcarpeta única no repetible para este archivo
$uniqueFolder = 'img_' . uniqid() . '_' . bin2hex(random_bytes(4));
$targetSubdir = $baseUploadDir . '/' . $uniqueFolder;

if (!mkdir($targetSubdir, 0755, true)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'No se pudo crear la carpeta única para la imagen en el servidor.']);
    exit;
}

// Generar nombre estandarizado para el archivo final en formato WebP
$cleanFilename = 'product_' . time() . '.webp';
$destination = $targetSubdir . '/' . $cleanFilename;
$relativeUrl = 'uploads/' . $uniqueFolder . '/' . $cleanFilename;

// Función para redimensionar y comprimir la imagen en GD
function compressImage($sourcePath, $destinationPath, $mimeType, $maxDimension = 1000) {
    switch ($mimeType) {
        case 'image/jpeg':
        case 'image/jpg':
            $image = @imagecreatefromjpeg($sourcePath);
            break;
        case 'image/png':
            $image = @imagecreatefrompng($sourcePath);
            break;
        case 'image/gif':
            $image = @imagecreatefromgif($sourcePath);
            break;
        case 'image/webp':
            $image = @imagecreatefromwebp($sourcePath);
            break;
        default:
            return false;
    }

    if (!$image) {
        return false;
    }

    // Dimensiones actuales
    $width = imagesx($image);
    $height = imagesy($image);

    // Redimensionar si supera la dimensión máxima de 1000px para web
    if ($width > $maxDimension || $height > $maxDimension) {
        if ($width > $height) {
            $newWidth = $maxDimension;
            $newHeight = round(($height / $width) * $maxDimension);
        } else {
            $newHeight = $maxDimension;
            $newWidth = round(($width / $height) * $maxDimension);
        }
        
        $resizedImage = imagecreatetruecolor($newWidth, $newHeight);
        
        // Mantener transparencias para PNG/WEBP
        if ($mimeType === 'image/png' || $mimeType === 'image/webp' || $mimeType === 'image/gif') {
            imagealphablending($resizedImage, false);
            imagesavealpha($resizedImage, true);
            $transparent = imagecolorallocatealpha($resizedImage, 0, 0, 0, 127);
            imagefill($resizedImage, 0, 0, $transparent);
        }
        
        imagecopyresampled($resizedImage, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
        imagedestroy($image);
        $image = $resizedImage;
    } else {
        // Si no se redimensiona, aplicar canal alfa por si acaso al guardar
        if ($mimeType === 'image/png' || $mimeType === 'image/webp' || $mimeType === 'image/gif') {
            imagealphablending($image, false);
            imagesavealpha($image, true);
        }
    }

    // Guardar siempre en formato WebP con 80% de calidad
    $saveResult = imagewebp($image, $destinationPath, 80);

    imagedestroy($image);
    return $saveResult;
}

// Procesar la subida y compresión
if (compressImage($file['tmp_name'], $destination, $fileMime)) {
    echo json_encode([
        'success' => true,
        'message' => 'Imagen subida y comprimida con éxito.',
        'url' => $relativeUrl
    ]);
} else {
    // Si la compresión falla, intentar mover directamente como respaldo
    if (move_uploaded_file($file['tmp_name'], $destination)) {
        echo json_encode([
            'success' => true,
            'message' => 'Imagen subida (sin compresión debido a un fallo del codificador).',
            'url' => $relativeUrl
        ]);
    } else {
        // Limpiar el subdirectorio si todo falló
        @rmdir($targetSubdir);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al guardar la imagen en el servidor.']);
    }
}
?>
