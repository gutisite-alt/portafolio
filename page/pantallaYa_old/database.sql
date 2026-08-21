-- Esquema de Base de Datos para PantallaYA

CREATE DATABASE IF NOT EXISTS `pantallaya_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `pantallaya_db`;

-- 1. Tabla de Usuarios (anunciantes y administradores)
CREATE TABLE IF NOT EXISTS `usuarios` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `rol` VARCHAR(20) DEFAULT 'cliente', -- 'cliente', 'admin'
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla de Campañas
CREATE TABLE IF NOT EXISTS `campanas` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `edificio` VARCHAR(150) NOT NULL,
    `plan` VARCHAR(50) NOT NULL, -- 'basico', 'negocio', 'premium'
    `direccion` VARCHAR(200) NOT NULL,
    `torre` VARCHAR(50) DEFAULT NULL,
    `bloque` VARCHAR(50) DEFAULT NULL,
    `observaciones` TEXT DEFAULT NULL,
    `pago_metodo` VARCHAR(50) NOT NULL, -- 'tc', 'pse'
    `pago_estado` VARCHAR(50) DEFAULT 'aprobado',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_campanas_usuarios` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla de Archivos Multimedia asociados a las Campañas
CREATE TABLE IF NOT EXISTS `archivos` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `campana_id` INT NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(255) NOT NULL, -- Ej: 'uploads/camp_123/archivo.png'
    `file_size` INT NOT NULL, -- En bytes
    `file_type` VARCHAR(50) NOT NULL, -- 'image', 'video'
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_archivos_campanas` FOREIGN KEY (`campana_id`) REFERENCES `campanas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
