-- phpMyAdmin SQL Dump
-- version 4.9.0.1
-- https://www.phpmyadmin.net/
--
-- Servidor: sql305.ezyro.com
-- Tiempo de generación: 10-07-2026 a las 09:53:48
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
(1, 2, 'Nuevo Administrador', 'THEME_UPDATE', 'users', 2, 'El usuario actualizó su preferencia de tema visual a \'dark\'.', '181.48.53.226', '2026-07-08 21:37:53'),
(2, 2, 'Nuevo Administrador', 'THEME_UPDATE', 'users', 2, 'El usuario actualizó su preferencia de tema visual a \'light\'.', '181.48.53.226', '2026-07-08 21:37:58'),
(3, 2, 'Nuevo Administrador', 'PROFILE_UPDATE', 'users', 2, 'El usuario actualizó su propio perfil: \'Miller Harold\' (admin@admin.com).', '181.48.53.226', '2026-07-08 21:47:22'),
(4, 2, 'Miller Harold', 'THEME_UPDATE', 'users', 2, 'El usuario actualizó su preferencia de tema visual a \'dark\'.', '181.48.53.226', '2026-07-08 21:59:37'),
(5, 2, 'Miller Harold', 'THEME_UPDATE', 'users', 2, 'El usuario actualizó su preferencia de tema visual a \'light\'.', '181.48.53.226', '2026-07-08 21:59:40'),
(6, 2, 'Miller Harold', 'THEME_UPDATE', 'users', 2, 'El usuario actualizó su preferencia de tema visual a \'dark\'.', '181.48.53.226', '2026-07-10 12:53:47'),
(7, 2, 'Miller Harold', 'THEME_UPDATE', 'users', 2, 'El usuario actualizó su preferencia de tema visual a \'light\'.', '181.48.53.226', '2026-07-10 12:54:02'),
(8, 2, 'Miller Harold', 'USER_CREATE', 'users', 3, 'Se creó un nuevo usuario: \'Maria Gutierrez\' (maria@gmail.com) con el rol de \'operator\'.', '181.48.53.226', '2026-07-10 13:43:45'),
(9, 2, 'Miller Harold', 'PROFILE_UPDATE', 'users', 2, 'El usuario actualizó su propio perfil: \'Miller Harold Gutiérrez\' (admin@admin.com).', '181.48.53.226', '2026-07-10 13:44:08'),
(10, 2, 'Miller Harold Gutiérrez', 'THEME_UPDATE', 'users', 2, 'El usuario actualizó su preferencia de tema visual a \'dark\'.', '181.48.53.226', '2026-07-10 13:46:45'),
(11, 2, 'Miller Harold Gutiérrez', 'THEME_UPDATE', 'users', 2, 'El usuario actualizó su preferencia de tema visual a \'light\'.', '181.48.53.226', '2026-07-10 13:46:53');

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
(6, 'AEG'),
(7, 'AOT');

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

--
-- Volcado de datos para la tabla `categories`
--

INSERT INTO `categories` (`id`, `name`) VALUES
(4, 'Dormitorio'),
(3, 'Electrodomésticos'),
(5, 'Menaje y Hogar'),
(2, 'Muebles de Salón'),
(1, 'Sofás y Descanso');

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
(4, 'CLI-304', 'Juan perez', '56645654', '3201853659', 'juan@yahoo.es', 'Av. de la Constitución 12, Coslada', 'Madrid', '2026-07-10 13:40:03', '2026-07-10 13:40:03');

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
(1, 'Anaya Outlet S.L.', 'B-87654321', '+34 910 123 456', 'contacto@anayaoutlet.com', 'Calle Mayor 124, Polígono Industrial Oeste', 'Madrid', 'Madrid', 21, '€', '2026-07-07 19:23:43', NULL, NULL, NULL);

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

--
-- Volcado de datos para la tabla `suppliers`
--

INSERT INTO `suppliers` (`id`, `custom_id`, `name`, `contact`, `phone`, `email`, `address`, `status`, `created_at`, `updated_at`) VALUES
(1, 'SUP-101', 'Amarbel', 'Diego costas', '3201853659', 'juan@yahoo.es', 'Torecilla cordoba', 'Activo', '2026-07-10 13:41:24', '2026-07-10 13:41:24');

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
(2, 'Miller Harold Gutiérrez', 'admin@admin.com', '$2y$10$tnluC8oekC6Gts1eXQPoW.BmAJrG6oXaoeV1LQ76TivFRze/d7Mpy', 'admin', '2026-07-08 21:28:36', '2026-07-10 13:46:53', '+57 3135159142', NULL, NULL, 'light'),
(3, 'Maria Gutierrez', 'maria@gmail.com', '$2y$10$ZQLDoKGdSGSKcBax1CJ0CuNRE6uj.QUmvJ5DPC8VG8H/aHElvdIFS', 'operator', '2026-07-10 13:43:45', '2026-07-10 13:43:45', '+34 600 123 456', NULL, NULL, 'light');

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
-- AUTO_INCREMENT de la tabla `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `brands`
--
ALTER TABLE `brands`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

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
