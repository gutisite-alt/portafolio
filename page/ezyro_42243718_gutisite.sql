-- phpMyAdmin SQL Dump
-- version 4.9.0.1
-- https://www.phpmyadmin.net/
--
-- Servidor: sql305.ezyro.com
-- Tiempo de generación: 13-08-2026 a las 15:37:42
-- Versión del servidor: 11.4.12-MariaDB
-- Versión de PHP: 7.2.22

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `ezyro_42243718_gutisite`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `archivos`
--

CREATE TABLE `archivos` (
  `id` int(11) NOT NULL,
  `campana_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_size` int(11) NOT NULL,
  `file_type` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `archivos`
--

INSERT INTO `archivos` (`id`, `campana_id`, `file_name`, `file_path`, `file_size`, `file_type`, `created_at`) VALUES
(3, 1, 'Claro todo en uno.mp4', 'uploads/camp_1/YTDown.com_YouTube_Media_JmgAc8ZAULI_001_1080p.mp4', 2630502, 'video', '2026-07-21 17:32:41');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `user_name` varchar(150) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `table_name` varchar(100) NOT NULL,
  `record_id` int(11) DEFAULT NULL,
  `description` text NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `user_name`, `action`, `table_name`, `record_id`, `description`, `ip_address`, `created_at`) VALUES
(1, 2, 'Miller Harold Gutiérrez', 'THEME_UPDATE', 'users', 2, 'El usuario actualizó su preferencia de tema visual a \'system\'.', '181.48.53.226', '2026-07-14 20:20:27'),
(2, 2, 'Miller Harold Gutiérrez', 'THEME_UPDATE', 'users', 2, 'El usuario actualizó su preferencia de tema visual a \'dark\'.', '181.48.53.226', '2026-07-14 20:20:29'),
(3, 2, 'Miller Harold Gutiérrez', 'THEME_UPDATE', 'users', 2, 'El usuario actualizó su preferencia de tema visual a \'light\'.', '181.48.53.226', '2026-07-14 20:20:31'),
(4, 2, 'Miller Harold Gutiérrez', 'LOGIN', 'users', 2, 'El usuario inició sesión correctamente.', '181.48.53.226', '2026-07-15 21:57:28'),
(5, 2, 'Miller Harold Gutiérrez', 'LOGIN', 'users', 2, 'El usuario inició sesión correctamente.', '181.48.53.226', '2026-07-15 21:57:28'),
(6, 2, 'Miller Harold Gutiérrez', 'SETTINGS_UPDATE', 'settings', 1, 'Se actualizó la configuración de la empresa.', '181.48.53.226', '2026-07-15 21:58:12'),
(7, 2, 'Miller Harold Gutiérrez', 'CLIENT_CREATE', 'clients', 1, 'Se creó el cliente: Maria Gutierrez, ID personalizado: CLI-305.', '181.48.53.226', '2026-07-15 21:58:37');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `brands`
--

CREATE TABLE `brands` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `brands`
--

INSERT INTO `brands` (`id`, `name`) VALUES
(1, 'AEG');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `campanas`
--

CREATE TABLE `campanas` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `edificio` varchar(150) NOT NULL,
  `plan` varchar(50) NOT NULL,
  `direccion` varchar(200) NOT NULL,
  `torre` varchar(50) DEFAULT NULL,
  `bloque` varchar(50) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `pago_metodo` varchar(50) NOT NULL,
  `pago_estado` varchar(50) DEFAULT 'aprobado',
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `campanas`
--

INSERT INTO `campanas` (`id`, `user_id`, `nombre`, `edificio`, `plan`, `direccion`, `torre`, `bloque`, `observaciones`, `pago_metodo`, `pago_estado`, `created_at`) VALUES
(1, 1, 'Juan jose martinez', 'Parques de bolivar', 'Plan Negocio', 'Calle 33 # 25 - 85', '4-5-9', 'A-C-F', 'Se asignan para cada uno de los edificios comunes', 'pse', 'aprobado', '2026-07-21 17:23:17');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cash_movements`
--

CREATE TABLE `cash_movements` (
  `id` int(11) NOT NULL,
  `cash_session_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` enum('Entrada','Salida') NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `reason` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cash_sessions`
--

CREATE TABLE `cash_sessions` (
  `id` int(11) NOT NULL,
  `custom_id` varchar(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `status` enum('Abierta','Cerrada') NOT NULL DEFAULT 'Abierta',
  `opening_date` timestamp NULL DEFAULT current_timestamp(),
  `closing_date` timestamp NULL DEFAULT NULL,
  `initial_base` decimal(10,2) NOT NULL DEFAULT 0.00,
  `cash_sales` decimal(10,2) NOT NULL DEFAULT 0.00,
  `card_sales` decimal(10,2) NOT NULL DEFAULT 0.00,
  `cash_inflows` decimal(10,2) NOT NULL DEFAULT 0.00,
  `cash_outflows` decimal(10,2) NOT NULL DEFAULT 0.00,
  `expected_cash` decimal(10,2) NOT NULL DEFAULT 0.00,
  `real_cash` decimal(10,2) DEFAULT NULL,
  `difference` decimal(10,2) DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clients`
--

CREATE TABLE `clients` (
  `id` int(11) NOT NULL,
  `custom_id` varchar(20) NOT NULL,
  `name` varchar(150) NOT NULL,
  `document` varchar(30) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `clients`
--

INSERT INTO `clients` (`id`, `custom_id`, `name`, `document`, `phone`, `email`, `address`, `city`, `created_at`, `updated_at`) VALUES
(1, 'CLI-305', 'Maria Gutierrez', '56645654', '3201853659', 'amarbel@gmail.com', 'Av. de la Constitución 12, Coslada', 'Madrid', '2026-07-15 21:58:37', '2026-07-15 21:58:37');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cortes`
--

CREATE TABLE `cortes` (
  `id` varchar(36) NOT NULL,
  `fecha` date NOT NULL,
  `pliegos` decimal(8,3) NOT NULL,
  `motivo` varchar(100) DEFAULT NULL,
  `observacion` text DEFAULT NULL,
  `creado_en` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `hojas_imperfectas`
--

CREATE TABLE `hojas_imperfectas` (
  `id` int(11) NOT NULL,
  `corte_id` varchar(36) NOT NULL,
  `indice_hoja` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inventory_movements`
--

CREATE TABLE `inventory_movements` (
  `id` int(11) NOT NULL,
  `custom_id` varchar(20) NOT NULL,
  `product_id` int(11) NOT NULL,
  `qty` int(11) NOT NULL,
  `type` enum('Entrada','Salida','Ajuste') NOT NULL,
  `reason` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `invoices`
--

CREATE TABLE `invoices` (
  `id` int(11) NOT NULL,
  `custom_id` varchar(20) NOT NULL,
  `invoice_number` varchar(30) NOT NULL,
  `client_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_rate` int(11) NOT NULL DEFAULT 21,
  `tax_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('Cobrada','Pendiente','Devuelta') NOT NULL DEFAULT 'Pendiente',
  `payment_method` varchar(50) NOT NULL DEFAULT 'Tarjeta',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `invoice_items`
--

CREATE TABLE `invoice_items` (
  `id` int(11) NOT NULL,
  `invoice_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `qty` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `planes`
--

CREATE TABLE `planes` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `periodo` varchar(20) DEFAULT 'mes',
  `popular` tinyint(1) DEFAULT 0,
  `limite_pantallas` int(11) DEFAULT 5,
  `caracteristicas` text NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `planes`
--

INSERT INTO `planes` (`id`, `nombre`, `precio`, `periodo`, `popular`, `limite_pantallas`, `caracteristicas`, `created_at`) VALUES
(1, 'Emprendedor', '32000.00', 'mes', 0, 1, '[\"1 anuncio en rotación\",\"1 edificio a tu elección\",\"Soporte por WhatsApp\"]', '2026-07-21 20:11:47'),
(2, 'Plan Negocio', '95000.00', 'mes', 1, 3, '[\"Hasta 3 anuncios rotativos\",\"Presencia en 3 edificios cercanos\",\"Mayor frecuencia de aparición\",\"Reporte de métricas mensual\"]', '2026-07-21 20:11:47'),
(3, 'Plan Premium', '120000.00', 'mes', 0, 10, '[\"Cambios de anuncio ilimitados\",\"Presencia en hasta 10 edificios\",\"Rotación prioritaria (VIP)\",\"Diseño gráfico del anuncio incluido\"]', '2026-07-21 20:11:47');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `sku` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `brand` varchar(100) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `buy_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `sell_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `stock` int(11) NOT NULL DEFAULT 0,
  `min_stock` int(11) NOT NULL DEFAULT 0,
  `weight` varchar(50) DEFAULT NULL,
  `dimensions` varchar(100) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` enum('Disponible','Bajo Stock','Agotado') NOT NULL DEFAULT 'Disponible',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `purchase_orders`
--

CREATE TABLE `purchase_orders` (
  `id` int(11) NOT NULL,
  `custom_id` varchar(20) NOT NULL,
  `po_number` varchar(30) NOT NULL,
  `supplier_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('Pendiente','Aprobada','Recibida') NOT NULL DEFAULT 'Pendiente',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `purchase_order_items`
--

CREATE TABLE `purchase_order_items` (
  `id` int(11) NOT NULL,
  `purchase_order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `qty` int(11) NOT NULL,
  `cost` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `returns`
--

CREATE TABLE `returns` (
  `id` int(11) NOT NULL,
  `custom_id` varchar(20) NOT NULL,
  `invoice_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `reason` varchar(255) NOT NULL,
  `total_refunded` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL DEFAULT 1,
  `company_name` varchar(150) NOT NULL DEFAULT 'Anaya Outlet S.L.',
  `cif` varchar(30) NOT NULL DEFAULT 'B-87654321',
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `tax_rate` int(11) NOT NULL DEFAULT 21,
  `currency` varchar(10) NOT NULL DEFAULT '€',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `twilio_sid` varchar(100) DEFAULT NULL,
  `twilio_auth_token` varchar(100) DEFAULT NULL,
  `twilio_phone` varchar(30) DEFAULT NULL
) ;

--
-- Volcado de datos para la tabla `settings`
--

INSERT INTO `settings` (`id`, `company_name`, `cif`, `phone`, `email`, `address`, `city`, `state`, `tax_rate`, `currency`, `updated_at`, `twilio_sid`, `twilio_auth_token`, `twilio_phone`) VALUES
(1, 'Anaya Outlet S.L.', 'B-87654321', '+34 910 123 456', 'contacto@anayaoutlet.com', 'Calle Mayor 124, Polígono Industrial Oeste', 'Madrid', '', 21, '€', '2026-07-15 21:58:12', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `suppliers`
--

CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL,
  `custom_id` varchar(20) NOT NULL,
  `name` varchar(150) NOT NULL,
  `contact` varchar(100) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `status` enum('Activo','Inactivo') NOT NULL DEFAULT 'Activo',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT 'admin',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `phone` varchar(30) DEFAULT '+34 600 123 456',
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_expires` datetime DEFAULT NULL,
  `theme` varchar(50) NOT NULL DEFAULT 'light'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `updated_at`, `phone`, `reset_token`, `reset_expires`, `theme`) VALUES
(2, 'Miller Harold Gutiérrez', 'admin@admin.com', '$2y$10$tnluC8oekC6Gts1eXQPoW.BmAJrG6oXaoeV1LQ76TivFRze/d7Mpy', 'admin', '2026-07-14 14:58:16', '2026-07-14 20:20:31', '+57 3135159142', NULL, NULL, 'light');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rol` varchar(20) DEFAULT 'cliente',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `estado` varchar(20) DEFAULT 'activo',
  `limite_pantallas` int(11) DEFAULT 5,
  `avatar_theme` varchar(20) DEFAULT 'blue'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password_hash`, `rol`, `created_at`, `estado`, `limite_pantallas`, `avatar_theme`) VALUES
(1, 'Miller Harold Gutierrez', 'dg@recargamos.co', '$2y$10$JroOMrxPVNvKTcZW2xokj.vcFHootVNxHTmKX/gv.Oa.ggc0yTZIu', 'admin', '2026-07-21 17:19:53', 'activo', 5, 'blue');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `web_orders`
--

CREATE TABLE `web_orders` (
  `id` int(11) NOT NULL,
  `custom_id` varchar(20) NOT NULL,
  `order_number` varchar(50) NOT NULL,
  `client_name` varchar(150) NOT NULL,
  `client_document` varchar(50) NOT NULL,
  `client_email` varchar(150) NOT NULL,
  `client_phone` varchar(50) NOT NULL,
  `client_address` varchar(255) NOT NULL,
  `client_city` varchar(100) NOT NULL,
  `preferred_store` varchar(100) NOT NULL,
  `comments` text DEFAULT NULL,
  `total` decimal(10,2) NOT NULL,
  `status` enum('Pendiente','Procesado','Cancelado') DEFAULT 'Pendiente',
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `web_order_items`
--

CREATE TABLE `web_order_items` (
  `id` int(11) NOT NULL,
  `web_order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `qty` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `archivos`
--
ALTER TABLE `archivos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_archivos_campanas` (`campana_id`);

--
-- Indices de la tabla `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_created` (`created_at`),
  ADD KEY `idx_audit_action` (`action`);

--
-- Indices de la tabla `brands`
--
ALTER TABLE `brands`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indices de la tabla `campanas`
--
ALTER TABLE `campanas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_campanas_usuarios` (`user_id`);

--
-- Indices de la tabla `cash_movements`
--
ALTER TABLE `cash_movements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cash_session_id` (`cash_session_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `cash_sessions`
--
ALTER TABLE `cash_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `custom_id` (`custom_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indices de la tabla `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `custom_id` (`custom_id`),
  ADD UNIQUE KEY `document` (`document`),
  ADD KEY `idx_client_name` (`name`);

--
-- Indices de la tabla `cortes`
--
ALTER TABLE `cortes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_fecha` (`fecha`);

--
-- Indices de la tabla `hojas_imperfectas`
--
ALTER TABLE `hojas_imperfectas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_hojas_corte` (`corte_id`);

--
-- Indices de la tabla `inventory_movements`
--
ALTER TABLE `inventory_movements`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `custom_id` (`custom_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_movement_date` (`date`),
  ADD KEY `idx_movement_product` (`product_id`);

--
-- Indices de la tabla `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `custom_id` (`custom_id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD KEY `client_id` (`client_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_invoice_date` (`date`),
  ADD KEY `idx_invoice_status` (`status`);

--
-- Indices de la tabla `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `idx_item_invoice` (`invoice_id`);

--
-- Indices de la tabla `planes`
--
ALTER TABLE `planes`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD KEY `supplier_id` (`supplier_id`),
  ADD KEY `idx_product_sku` (`sku`),
  ADD KEY `idx_product_name` (`name`),
  ADD KEY `idx_product_category` (`category`);

--
-- Indices de la tabla `purchase_orders`
--
ALTER TABLE `purchase_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `custom_id` (`custom_id`),
  ADD UNIQUE KEY `po_number` (`po_number`),
  ADD KEY `supplier_id` (`supplier_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_po_status` (`status`);

--
-- Indices de la tabla `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `idx_item_po` (`purchase_order_id`);

--
-- Indices de la tabla `returns`
--
ALTER TABLE `returns`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `custom_id` (`custom_id`),
  ADD KEY `invoice_id` (`invoice_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `custom_id` (`custom_id`),
  ADD KEY `idx_supplier_name` (`name`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indices de la tabla `web_orders`
--
ALTER TABLE `web_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `custom_id` (`custom_id`),
  ADD UNIQUE KEY `order_number` (`order_number`);

--
-- Indices de la tabla `web_order_items`
--
ALTER TABLE `web_order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `web_order_id` (`web_order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `archivos`
--
ALTER TABLE `archivos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `brands`
--
ALTER TABLE `brands`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `campanas`
--
ALTER TABLE `campanas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `cash_movements`
--
ALTER TABLE `cash_movements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `cash_sessions`
--
ALTER TABLE `cash_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `hojas_imperfectas`
--
ALTER TABLE `hojas_imperfectas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `inventory_movements`
--
ALTER TABLE `inventory_movements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `invoice_items`
--
ALTER TABLE `invoice_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `planes`
--
ALTER TABLE `planes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `purchase_orders`
--
ALTER TABLE `purchase_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `returns`
--
ALTER TABLE `returns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `web_orders`
--
ALTER TABLE `web_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `web_order_items`
--
ALTER TABLE `web_order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `archivos`
--
ALTER TABLE `archivos`
  ADD CONSTRAINT `fk_archivos_campanas` FOREIGN KEY (`campana_id`) REFERENCES `campanas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `campanas`
--
ALTER TABLE `campanas`
  ADD CONSTRAINT `fk_campanas_usuarios` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `cash_movements`
--
ALTER TABLE `cash_movements`
  ADD CONSTRAINT `cash_movements_ibfk_1` FOREIGN KEY (`cash_session_id`) REFERENCES `cash_sessions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cash_movements_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `cash_sessions`
--
ALTER TABLE `cash_sessions`
  ADD CONSTRAINT `cash_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `hojas_imperfectas`
--
ALTER TABLE `hojas_imperfectas`
  ADD CONSTRAINT `fk_hojas_corte` FOREIGN KEY (`corte_id`) REFERENCES `cortes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `inventory_movements`
--
ALTER TABLE `inventory_movements`
  ADD CONSTRAINT `inventory_movements_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  ADD CONSTRAINT `inventory_movements_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`),
  ADD CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD CONSTRAINT `invoice_items_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `invoice_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Filtros para la tabla `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `purchase_orders`
--
ALTER TABLE `purchase_orders`
  ADD CONSTRAINT `purchase_orders_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  ADD CONSTRAINT `purchase_orders_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  ADD CONSTRAINT `purchase_order_items_ibfk_1` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchase_order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Filtros para la tabla `returns`
--
ALTER TABLE `returns`
  ADD CONSTRAINT `returns_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`),
  ADD CONSTRAINT `returns_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `web_order_items`
--
ALTER TABLE `web_order_items`
  ADD CONSTRAINT `web_order_items_ibfk_1` FOREIGN KEY (`web_order_id`) REFERENCES `web_orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `web_order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
