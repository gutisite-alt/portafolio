-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS `control_corte` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `control_corte`;

-- Tabla de cortes
CREATE TABLE IF NOT EXISTS `cortes` (
  `id` VARCHAR(36) NOT NULL,
  `fecha` DATE NOT NULL,
  `pliegos` DECIMAL(8,3) NOT NULL,
  `motivo` VARCHAR(100) DEFAULT NULL,
  `observacion` TEXT DEFAULT NULL,
  `creado_en` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fecha` (`fecha`)
) ENGINE=InnoDB;

-- Tabla de hojas imperfectas (descartadas)
CREATE TABLE IF NOT EXISTS `hojas_imperfectas` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `corte_id` VARCHAR(36) NOT NULL,
  `indice_hoja` INT NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_hojas_corte` 
    FOREIGN KEY (`corte_id`) REFERENCES `cortes` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
