-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Máy chủ: mysql:3306
-- Thời gian đã tạo: Th9 22, 2026 lúc 03:58 AM
-- Phiên bản máy phục vụ: 8.4.11
-- Phiên bản PHP: 8.3.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `auto_payment`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `bank_transactions`
--

CREATE TABLE `bank_transactions` (
  `id` bigint NOT NULL,
  `provider` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider_transaction_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_id` bigint DEFAULT NULL,
  `bank` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transfer_type` enum('IN','OUT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` bigint NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `transaction_time` datetime(3) DEFAULT NULL,
  `raw_payload` json NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `bank_transactions`
--

INSERT INTO `bank_transactions` (`id`, `provider`, `provider_transaction_id`, `payment_id`, `bank`, `transfer_type`, `amount`, `content`, `transaction_time`, `raw_payload`, `created_at`) VALUES
(53, 'SEPAY', '30653', 29, 'MBBank', 'IN', 100000, 'PAY29B5866BAF45', '2026-09-09 17:43:06.000', '{\"id\": 30653, \"code\": \"\", \"content\": \"PAY29B5866BAF45\", \"gateway\": \"MBBank\", \"subAccount\": \"\", \"accumulated\": 0, \"description\": \"PAY29B5866BAF45\", \"transferType\": \"in\", \"accountNumber\": \"0328421191\", \"referenceCode\": \"SBF0E5F611DABD\", \"transferAmount\": 100000, \"transactionDate\": \"2026-09-10 00:43:06\"}', '2026-09-09 17:43:09.195'),
(54, 'SEPAY', '30654', 29, 'MBBank', 'IN', 100000, 'PAY29B5866BAF45', '2026-09-09 17:44:54.000', '{\"id\": 30654, \"code\": \"\", \"content\": \"PAY29B5866BAF45\", \"gateway\": \"MBBank\", \"subAccount\": \"\", \"accumulated\": 0, \"description\": \"PAY29B5866BAF45\", \"transferType\": \"in\", \"accountNumber\": \"0328421191\", \"referenceCode\": \"SB7F183A30680F\", \"transferAmount\": 100000, \"transactionDate\": \"2026-09-10 00:44:54\"}', '2026-09-09 17:44:56.878'),
(55, 'SEPAY', '30767', 30, 'MBBank', 'IN', 100000, 'PAY034579D25435', '2026-09-10 07:32:39.000', '{\"id\": 30767, \"code\": \"\", \"content\": \"PAY034579D25435\", \"gateway\": \"MBBank\", \"subAccount\": \"\", \"accumulated\": 0, \"description\": \"PAY034579D25435\", \"transferType\": \"in\", \"accountNumber\": \"0328421191\", \"referenceCode\": \"SB6C32A0CEBFAA\", \"transferAmount\": 100000, \"transactionDate\": \"2026-09-10 14:32:39\"}', '2026-09-10 07:32:42.710'),
(56, 'SEPAY', '80707452', 32, 'MBBank', 'IN', 10000, '146214061301-PAY2DA6BC4BE601-CHUYEN TIEN-OQCH000JiOuX-MOMO146214061301MOMO', '2026-09-10 12:27:00.000', '{\"id\": 80707452, \"code\": null, \"content\": \"146214061301-PAY2DA6BC4BE601-CHUYEN TIEN-OQCH000JiOuX-MOMO146214061301MOMO\", \"gateway\": \"MBBank\", \"subAccount\": null, \"accumulated\": 0, \"description\": \"BankAPINotify 146214061301-PAY2DA6BC4BE601-CHUYEN TIEN-OQCH000JiOuX-MOMO146214061301MOMO\", \"transferType\": \"in\", \"accountNumber\": \"0328421191\", \"referenceCode\": \"FT26253896385338\", \"transferAmount\": 10000, \"transactionDate\": \"2026-09-10 19:27:00\"}', '2026-09-10 12:27:53.157'),
(57, 'SEPAY', '30857', 34, 'MBBank', 'IN', 200000, 'PAY5BBAA735E7F2', '2026-09-10 17:10:46.000', '{\"id\": 30857, \"code\": \"\", \"content\": \"PAY5BBAA735E7F2\", \"gateway\": \"MBBank\", \"subAccount\": \"\", \"accumulated\": 0, \"description\": \"PAY5BBAA735E7F2\", \"transferType\": \"in\", \"accountNumber\": \"0328421191\", \"referenceCode\": \"SBADACF349A849\", \"transferAmount\": 200000, \"transactionDate\": \"2026-09-11 00:10:46\"}', '2026-09-10 17:10:50.464'),
(58, 'SEPAY', '30858', 34, 'MBBank', 'IN', 1000000, 'thanh toan PAY5BBAA735E7F2', '2026-09-10 17:11:23.000', '{\"id\": 30858, \"code\": \"\", \"content\": \"thanh toan PAY5BBAA735E7F2\", \"gateway\": \"MBBank\", \"subAccount\": \"\", \"accumulated\": 0, \"description\": \"thanh toan PAY5BBAA735E7F2\", \"transferType\": \"in\", \"accountNumber\": \"0328421191\", \"referenceCode\": \"SB9690DEC02004\", \"transferAmount\": 1000000, \"transactionDate\": \"2026-09-11 00:11:23\"}', '2026-09-10 17:11:26.446'),
(59, 'SEPAY', '30859', 35, 'MBBank', 'IN', 200000, 'PAY0F6F8FFAFF41', '2026-09-10 17:15:40.000', '{\"id\": 30859, \"code\": \"\", \"content\": \"PAY0F6F8FFAFF41\", \"gateway\": \"MBBank\", \"subAccount\": \"\", \"accumulated\": 0, \"description\": \"PAY0F6F8FFAFF41\", \"transferType\": \"in\", \"accountNumber\": \"0328421191\", \"referenceCode\": \"SBB43F92599F5F\", \"transferAmount\": 200000, \"transactionDate\": \"2026-09-11 00:15:40\"}', '2026-09-10 17:15:43.878'),
(60, 'SEPAY', '30860', 36, 'MBBank', 'IN', 1000000, 'PAYDAE9D18E7CC5', '2026-09-10 17:25:08.000', '{\"id\": 30860, \"code\": \"\", \"content\": \"PAYDAE9D18E7CC5\", \"gateway\": \"MBBank\", \"subAccount\": \"\", \"accumulated\": 0, \"description\": \"PAYDAE9D18E7CC5\", \"transferType\": \"in\", \"accountNumber\": \"0328421191\", \"referenceCode\": \"SB3386C882F152\", \"transferAmount\": 1000000, \"transactionDate\": \"2026-09-11 00:25:08\"}', '2026-09-10 17:25:12.273'),
(68, 'SEPAY', '33162', 55, 'MBBank', 'IN', 277000, 'PAY10152544D1A5', '2026-09-22 03:53:10.000', '{\"id\": 33162, \"code\": \"\", \"content\": \"PAY10152544D1A5\", \"gateway\": \"MBBank\", \"subAccount\": \"\", \"accumulated\": 0, \"description\": \"PAY10152544D1A5\", \"transferType\": \"in\", \"accountNumber\": \"0328421191\", \"referenceCode\": \"SBEC2859C13A1B\", \"transferAmount\": 277000, \"transactionDate\": \"2026-09-22 10:53:10\"}', '2026-09-22 03:53:13.648');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `orders`
--

CREATE TABLE `orders` (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `checkout_key` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `request_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('PENDING','PAID','EXPIRED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `total_amount` bigint NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `paid_at` datetime(3) DEFAULT NULL,
  `cancelled_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `checkout_key`, `request_hash`, `status`, `total_amount`, `created_at`, `updated_at`, `paid_at`, `cancelled_at`) VALUES
(2, 5, '550e8400-e29b-41d4-a716-446655440001', 'd35df1663a8a28e89677ea412365cd18287c85a0dcdf4439f7e12dbbdfbab270', 'PAID', 177000, '2026-09-20 16:16:00.031', '2026-09-20 16:22:30.813', '2026-09-20 16:22:30.675', NULL),
(3, 5, '550e8400-e49b-41d4-a716-446655440002', '18dc1197dc991e6eb7d9bb0c212481cfac39375536c0f68f094bd0b0db672135', 'PENDING', 387000, '2026-09-20 16:57:47.307', '2026-09-20 16:57:47.307', NULL, NULL),
(15, 32, '213b816d-b2ca-40ee-9bd9-30f35c6a4f0a', '09ca1fc59fad3824a90bc2d49ddd218688a1d13467f26015552a33b483f6fa60', 'PENDING', 277000, '2026-09-22 02:13:44.615', '2026-09-22 02:13:44.615', NULL, NULL),
(16, 32, '1c787c58-e0ca-4f3a-a81e-7d277bd8978c', '09ca1fc59fad3824a90bc2d49ddd218688a1d13467f26015552a33b483f6fa60', 'PAID', 277000, '2026-09-22 02:33:07.885', '2026-09-22 02:33:12.100', '2026-09-22 02:33:11.960', NULL),
(17, 32, 'd3e35f2d-d8a5-47a8-b88b-eeb91d4b276d', '09ca1fc59fad3824a90bc2d49ddd218688a1d13467f26015552a33b483f6fa60', 'CANCELLED', 277000, '2026-09-22 02:33:34.432', '2026-09-22 02:43:31.399', NULL, '2026-09-22 02:43:31.354'),
(18, 32, '2219b7f9-7f0c-4e7b-b207-5e281e9483ef', '87bcac813734cd9d140e9b50d344b398f9bfc35f61a5c9d5931ce083bdaeff16', 'EXPIRED', 188000, '2026-09-22 02:44:35.395', '2026-09-22 02:52:28.204', NULL, NULL),
(19, 32, '7819883e-4010-4fc8-8da6-bb641c0ea1c9', '87bcac813734cd9d140e9b50d344b398f9bfc35f61a5c9d5931ce083bdaeff16', 'EXPIRED', 188000, '2026-09-22 02:56:14.141', '2026-09-22 03:11:18.396', NULL, NULL),
(20, 32, 'd4483bcc-6535-4702-aaee-a20d5e8a0dfb', '87bcac813734cd9d140e9b50d344b398f9bfc35f61a5c9d5931ce083bdaeff16', 'CANCELLED', 188000, '2026-09-22 03:38:50.075', '2026-09-22 03:52:28.978', NULL, '2026-09-22 03:52:28.933'),
(21, 32, '0b1a24a6-65d1-4c9a-aa27-af8e27e6385b', '09ca1fc59fad3824a90bc2d49ddd218688a1d13467f26015552a33b483f6fa60', 'PAID', 277000, '2026-09-22 03:52:48.208', '2026-09-22 03:53:14.004', '2026-09-22 03:53:13.958', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_items`
--

CREATE TABLE `order_items` (
  `id` bigint NOT NULL,
  `order_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `product_name_snapshot` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_price_snapshot` bigint NOT NULL,
  `quantity` int NOT NULL,
  `subtotal` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name_snapshot`, `unit_price_snapshot`, `quantity`, `subtotal`) VALUES
(3, 2, 2, 'Sản phẩm 1', 59000, 3, 177000),
(4, 3, 3, 'Sản phẩm 2', 129000, 3, 387000),
(16, 15, 2, 'Sản phẩm 1', 59000, 1, 59000),
(17, 15, 3, 'Sản phẩm 2', 129000, 1, 129000),
(18, 15, 4, 'Sản phẩm 3', 89000, 1, 89000),
(19, 16, 2, 'Sản phẩm 1', 59000, 1, 59000),
(20, 16, 3, 'Sản phẩm 2', 129000, 1, 129000),
(21, 16, 4, 'Sản phẩm 3', 89000, 1, 89000),
(22, 17, 2, 'Sản phẩm 1', 59000, 1, 59000),
(23, 17, 3, 'Sản phẩm 2', 129000, 1, 129000),
(24, 17, 4, 'Sản phẩm 3', 89000, 1, 89000),
(25, 18, 2, 'Sản phẩm 1', 59000, 1, 59000),
(26, 18, 3, 'Sản phẩm 2', 129000, 1, 129000),
(27, 19, 2, 'Sản phẩm 1', 59000, 1, 59000),
(28, 19, 3, 'Sản phẩm 2', 129000, 1, 129000),
(29, 20, 2, 'Sản phẩm 1', 59000, 1, 59000),
(30, 20, 3, 'Sản phẩm 2', 129000, 1, 129000),
(31, 21, 2, 'Sản phẩm 1', 59000, 1, 59000),
(32, 21, 3, 'Sản phẩm 2', 129000, 1, 129000),
(33, 21, 4, 'Sản phẩm 3', 89000, 1, 89000);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `payments`
--

CREATE TABLE `payments` (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `payment_code` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` bigint NOT NULL,
  `status` enum('PENDING','PAID','EXPIRED','FAILED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `expired_at` datetime(3) DEFAULT NULL,
  `paid_at` datetime(3) DEFAULT NULL,
  `method` enum('BANK_TRANSFER','BALANCE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BANK_TRANSFER',
  `order_id` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `payments`
--

INSERT INTO `payments` (`id`, `user_id`, `payment_code`, `amount`, `status`, `created_at`, `updated_at`, `expired_at`, `paid_at`, `method`, `order_id`) VALUES
(15, 5, 'PAYE2908B9B3011', 100000, 'EXPIRED', '2026-09-06 04:26:39.463', '2026-09-20 17:00:16.754', '2026-09-06 04:41:39.449', NULL, 'BANK_TRANSFER', NULL),
(16, 5, 'PAY90FBD5E17608', 100000, 'EXPIRED', '2026-09-06 04:27:54.853', '2026-09-20 17:00:16.754', '2026-09-06 04:42:54.851', NULL, 'BANK_TRANSFER', NULL),
(18, 5, 'PAY818B94FF592F', 100000, 'EXPIRED', '2026-09-06 04:30:35.622', '2026-09-20 17:00:16.754', '2026-09-06 04:45:35.607', NULL, 'BANK_TRANSFER', NULL),
(29, 5, 'PAY29B5866BAF45', 100000, 'PAID', '2026-09-09 17:42:36.480', '2026-09-09 17:43:09.426', '2026-09-09 17:57:36.463', '2026-09-09 17:43:09.421', 'BANK_TRANSFER', NULL),
(30, 32, 'PAY034579D25435', 100000, 'PAID', '2026-09-10 07:32:22.730', '2026-09-10 07:32:42.934', '2026-09-10 07:47:22.725', '2026-09-10 07:32:42.933', 'BANK_TRANSFER', NULL),
(31, 32, 'PAYCFF325CC3038', 10000, 'EXPIRED', '2026-09-10 08:33:17.568', '2026-09-10 08:40:19.494', '2026-09-10 08:40:17.565', NULL, 'BANK_TRANSFER', NULL),
(32, 32, 'PAY2DA6BC4BE601', 10000, 'PAID', '2026-09-10 12:27:23.765', '2026-09-10 12:27:53.390', '2026-09-10 12:42:23.755', '2026-09-10 12:27:53.386', 'BANK_TRANSFER', NULL),
(33, 32, 'PAY19AB1DF98AE1', 100000, 'EXPIRED', '2026-09-10 16:43:32.702', '2026-09-10 16:58:33.216', '2026-09-10 16:58:32.698', NULL, 'BANK_TRANSFER', NULL),
(34, 32, 'PAY5BBAA735E7F2', 1000000, 'PAID', '2026-09-10 17:10:32.632', '2026-09-10 17:11:26.669', '2026-09-10 17:25:32.630', '2026-09-10 17:11:26.669', 'BANK_TRANSFER', NULL),
(35, 34, 'PAY0F6F8FFAFF41', 10000, 'PENDING', '2026-09-10 17:15:24.975', '2026-09-10 17:15:24.975', '2026-09-10 17:30:24.973', NULL, 'BANK_TRANSFER', NULL),
(36, 32, 'PAYDAE9D18E7CC5', 10000, 'PAID', '2026-09-10 17:24:52.198', '2026-09-10 17:25:12.496', '2026-09-10 17:39:52.186', '2026-09-10 17:25:12.495', 'BANK_TRANSFER', NULL),
(37, 5, 'PAYCF402D81D94A', 177000, 'PAID', '2026-09-20 16:22:30.676', '2026-09-20 16:22:30.676', NULL, '2026-09-20 16:22:30.675', 'BALANCE', 2),
(38, 5, 'PAYAEB7A8CD9881', 387000, 'PENDING', '2026-09-20 16:58:16.314', '2026-09-20 16:58:16.314', '2026-09-20 17:13:16.263', NULL, 'BANK_TRANSFER', 3),
(50, 32, 'PAY8F1950121634', 277000, 'PAID', '2026-09-22 02:33:11.961', '2026-09-22 02:33:11.961', NULL, '2026-09-22 02:33:11.960', 'BALANCE', 16),
(51, 32, 'PAYDEBF5CE84B57', 277000, 'CANCELLED', '2026-09-22 02:33:36.220', '2026-09-22 02:43:31.355', '2026-09-22 02:48:36.172', NULL, 'BANK_TRANSFER', 17),
(52, 32, 'PAYF65E1E9CC563', 188000, 'EXPIRED', '2026-09-22 02:44:39.472', '2026-09-22 02:52:28.160', '2026-09-22 02:51:21.187', NULL, 'BANK_TRANSFER', 18),
(53, 32, 'PAYF4E7F9C3771B', 188000, 'EXPIRED', '2026-09-22 02:56:17.281', '2026-09-22 03:11:18.356', '2026-09-22 03:11:17.233', NULL, 'BANK_TRANSFER', 19),
(54, 32, 'PAYD9C134ED7E86', 188000, 'CANCELLED', '2026-09-22 03:38:51.765', '2026-09-22 03:52:28.937', '2026-09-22 03:53:51.716', NULL, 'BANK_TRANSFER', 20),
(55, 32, 'PAY10152544D1A5', 277000, 'PAID', '2026-09-22 03:52:50.361', '2026-09-22 03:53:13.959', '2026-09-22 04:07:50.313', '2026-09-22 03:53:13.958', 'BANK_TRANSFER', 21);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `products`
--

CREATE TABLE `products` (
  `id` bigint NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` bigint NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `products`
--

INSERT INTO `products` (`id`, `name`, `price`, `is_active`, `created_at`, `updated_at`) VALUES
(2, 'Sản phẩm 1', 59000, 1, '2026-09-19 17:15:23.972', '2026-09-19 17:15:23.972'),
(3, 'Sản phẩm 2', 129000, 1, '2026-09-19 17:15:23.976', '2026-09-19 17:15:23.976'),
(4, 'Sản phẩm 3', 89000, 1, '2026-09-19 17:15:23.980', '2026-09-19 17:15:23.980');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` bigint NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `balance` bigint NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `balance`, `created_at`, `updated_at`) VALUES
(5, 'test@example.com', '$argon2id$v=19$m=65536,p=4,t=3$dXWLAHC0u5HSQpZBKHg4eA$aSI9jMrMVFr58ZL0/f3mg2S+6Bn/9Zu40aQ43sP78ZA', 823000, '2026-09-01 09:33:09.596', '2026-09-20 16:22:30.771'),
(32, 'test2@gmail.com', '$argon2id$v=19$m=65536,p=4,t=3$CmK1ob3wzz2tZopO5uy1iA$0nStGpD71ljunB8FA8Cc7qYEQNEuqMeT7roQLeufQE0', 843000, '2026-09-10 06:47:16.935', '2026-09-22 02:33:12.054'),
(33, 'frontend-test@example.com', '$argon2id$v=19$m=65536,p=4,t=3$9bAcM8batPEVABEZIkXAzA$io6WdLZYO7YIUrMWvjECa7VOZihCFxB/zMq9jvM7u2o', 0, '2026-09-10 06:49:43.652', '2026-09-10 06:49:43.652'),
(34, '1@gmail.com', '$argon2id$v=19$m=65536,p=4,t=3$VwfEyXo/cLWz5K+CT0GeUw$oZg7O2MMCJghuW3szVcvy7vsi3C3YOzXcemc6C8e+zg', 0, '2026-09-10 17:12:41.254', '2026-09-10 17:12:41.254');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `webhook_logs`
--

CREATE TABLE `webhook_logs` (
  `id` bigint NOT NULL,
  `provider` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider_transaction_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payload` json NOT NULL,
  `status` enum('RECEIVED','PROCESSED','IGNORED','FAILED','DUPLICATE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RECEIVED',
  `received_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `processed_at` datetime(3) DEFAULT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `webhook_logs`
--

INSERT INTO `webhook_logs` (`id`, `provider`, `provider_transaction_id`, `payload`, `status`, `received_at`, `processed_at`, `error_message`) VALUES
(13, 'SEPAY', '29989', '{\"id\": 29989, \"code\": \"\", \"content\": \"Giao dich thu nghiem 23h47m38s\", \"gateway\": \"MBBank\", \"subAccount\": \"\", \"accumulated\": 0, \"description\": \"Giao dich thu nghiem 23h47m38s\", \"transferType\": \"in\", \"accountNumber\": \"0328421191\", \"referenceCode\": \"SB9DA302E8E994\", \"transferAmount\": 100000, \"transactionDate\": \"2026-09-06 23:47:40\"}', 'RECEIVED', '2026-09-06 16:47:45.974', NULL, NULL),
(14, 'SEPAY', '30643', '{\"id\": 30643, \"code\": \"\", \"content\": \"Giao dich thu nghiem 21h56m03s\", \"gateway\": \"MBBank\", \"subAccount\": \"\", \"accumulated\": 0, \"description\": \"Giao dich thu nghiem 21h56m03s\", \"transferType\": \"in\", \"accountNumber\": \"0328421191\", \"referenceCode\": \"SB6DAF0BCBF05A\", \"transferAmount\": 100000, \"transactionDate\": \"2026-09-09 21:56:07\"}', 'RECEIVED', '2026-09-09 14:56:10.370', NULL, NULL),
(15, 'SEPAY', '30642', '{\"id\": 30642, \"code\": \"\", \"content\": \"Giao dich thu nghiem 21h51m51s\", \"gateway\": \"MBBank\", \"subAccount\": \"\", \"accumulated\": 0, \"description\": \"Giao dich thu nghiem 21h51m51s\", \"transferType\": \"in\", \"accountNumber\": \"0328421191\", \"referenceCode\": \"SB1E2D5517A9A3\", \"transferAmount\": 100000, \"transactionDate\": \"2026-09-09 21:51:56\"}', 'RECEIVED', '2026-09-09 15:53:01.606', NULL, NULL),
(28, 'SEPAY', '30653', '{\"id\": 30653, \"code\": \"\", \"content\": \"PAY29B5866BAF45\", \"gateway\": \"MBBank\", \"subAccount\": \"\", \"accumulated\": 0, \"description\": \"PAY29B5866BAF45\", \"transferType\": \"in\", \"accountNumber\": \"0328421191\", \"referenceCode\": \"SBF0E5F611DABD\", \"transferAmount\": 100000, \"transactionDate\": \"2026-09-10 00:43:06\"}', 'PROCESSED', '2026-09-09 17:43:09.100', '2026-09-09 17:43:09.421', NULL),
(29, 'SEPAY', '30654', '{\"id\": 30654, \"code\": \"\", \"content\": \"PAY29B5866BAF45\", \"gateway\": \"MBBank\", \"subAccount\": \"\", \"accumulated\": 0, \"description\": \"PAY29B5866BAF45\", \"transferType\": \"in\", \"accountNumber\": \"0328421191\", \"referenceCode\": \"SB7F183A30680F\", \"transferAmount\": 100000, \"transactionDate\": \"2026-09-10 00:44:54\"}', 'IGNORED', '2026-09-09 17:44:56.780', '2026-09-09 17:44:57.098', 'Payment status is PAID'),
(30, 'SEPAY', '30767', '{\"id\": 30767, \"code\": \"\", \"content\": \"PAY034579D25435\", \"gateway\": \"MBBank\", \"subAccount\": \"\", \"accumulated\": 0, \"description\": \"PAY034579D25435\", \"transferType\": \"in\", \"accountNumber\": \"0328421191\", \"referenceCode\": \"SB6C32A0CEBFAA\", \"transferAmount\": 100000, \"transactionDate\": \"2026-09-10 14:32:39\"}', 'PROCESSED', '2026-09-10 07:32:42.609', '2026-09-10 07:32:42.933', NULL),
(31, 'SEPAY', '80707452', '{\"id\": 80707452, \"code\": null, \"content\": \"146214061301-PAY2DA6BC4BE601-CHUYEN TIEN-OQCH000JiOuX-MOMO146214061301MOMO\", \"gateway\": \"MBBank\", \"subAccount\": null, \"accumulated\": 0, \"description\": \"BankAPINotify 146214061301-PAY2DA6BC4BE601-CHUYEN TIEN-OQCH000JiOuX-MOMO146214061301MOMO\", \"transferType\": \"in\", \"accountNumber\": \"0328421191\", \"referenceCode\": \"FT26253896385338\", \"transferAmount\": 10000, \"transactionDate\": \"2026-09-10 19:27:00\"}', 'PROCESSED', '2026-09-10 12:27:53.057', '2026-09-10 12:27:53.386', NULL),
(32, 'SEPAY', '30857', '{\"id\": 30857, \"code\": \"\", \"content\": \"PAY5BBAA735E7F2\", \"gateway\": \"MBBank\", \"subAccount\": \"\", \"accumulated\": 0, \"description\": \"PAY5BBAA735E7F2\", \"transferType\": \"in\", \"accountNumber\": \"0328421191\", \"referenceCode\": \"SBADACF349A849\", \"transferAmount\": 200000, \"transactionDate\": \"2026-09-11 00:10:46\"}', 'IGNORED', '2026-09-10 17:10:50.367', '2026-09-10 17:10:50.686', 'Payment amount mismatch'),
(33, 'SEPAY', '30858', '{\"id\": 30858, \"code\": \"\", \"content\": \"thanh toan PAY5BBAA735E7F2\", \"gateway\": \"MBBank\", \"subAccount\": \"\", \"accumulated\": 0, \"description\": \"thanh toan PAY5BBAA735E7F2\", \"transferType\": \"in\", \"accountNumber\": \"0328421191\", \"referenceCode\": \"SB9690DEC02004\", \"transferAmount\": 1000000, \"transactionDate\": \"2026-09-11 00:11:23\"}', 'PROCESSED', '2026-09-10 17:11:26.351', '2026-09-10 17:11:26.669', NULL),
(34, 'SEPAY', '30859', '{\"id\": 30859, \"code\": \"\", \"content\": \"PAY0F6F8FFAFF41\", \"gateway\": \"MBBank\", \"subAccount\": \"\", \"accumulated\": 0, \"description\": \"PAY0F6F8FFAFF41\", \"transferType\": \"in\", \"accountNumber\": \"0328421191\", \"referenceCode\": \"SBB43F92599F5F\", \"transferAmount\": 200000, \"transactionDate\": \"2026-09-11 00:15:40\"}', 'IGNORED', '2026-09-10 17:15:43.784', '2026-09-10 17:15:44.100', 'Payment amount mismatch'),
(35, 'SEPAY', '30860', '{\"id\": 30860, \"code\": \"\", \"content\": \"PAYDAE9D18E7CC5\", \"gateway\": \"MBBank\", \"subAccount\": \"\", \"accumulated\": 0, \"description\": \"PAYDAE9D18E7CC5\", \"transferType\": \"in\", \"accountNumber\": \"0328421191\", \"referenceCode\": \"SB3386C882F152\", \"transferAmount\": 1000000, \"transactionDate\": \"2026-09-11 00:25:08\"}', 'PROCESSED', '2026-09-10 17:25:12.175', '2026-09-10 17:25:12.495', NULL),
(43, 'SEPAY', '33162', '{\"id\": 33162, \"code\": \"\", \"content\": \"PAY10152544D1A5\", \"gateway\": \"MBBank\", \"subAccount\": \"\", \"accumulated\": 0, \"description\": \"PAY10152544D1A5\", \"transferType\": \"in\", \"accountNumber\": \"0328421191\", \"referenceCode\": \"SBEC2859C13A1B\", \"transferAmount\": 277000, \"transactionDate\": \"2026-09-22 10:53:10\"}', 'PROCESSED', '2026-09-22 03:53:13.544', '2026-09-22 03:53:13.958', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `_prisma_migrations`
--

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('8c3e5c1c-0617-4b78-bd51-3399ef437ee6', 'eb393abd70b521e08fa4d2f7e633e37230a50b8cf942f638d5c35bb373a68825', '2026-08-31 05:06:53.762', '20260831045003_init_payment_schema', NULL, NULL, '2026-08-31 05:06:53.465', 1),
('f777182c-4602-44ac-be31-82ac97ac6003', 'eeb4d3680e09f25fb26510a3c7b22069a49a559587ab0e30691224425d8b63b8', '2026-09-19 15:09:10.389', '20260919142206_add_product_order_payment', NULL, NULL, '2026-09-19 15:09:09.816', 1);

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `bank_transactions`
--
ALTER TABLE `bank_transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `bank_transactions_provider_provider_transaction_id_key` (`provider`,`provider_transaction_id`),
  ADD KEY `bank_transactions_payment_id_key` (`payment_id`),
  ADD KEY `bank_transactions_transaction_time_idx` (`transaction_time`);

--
-- Chỉ mục cho bảng `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `orders_user_id_checkout_key_key` (`user_id`,`checkout_key`),
  ADD KEY `orders_user_id_created_at_idx` (`user_id`,`created_at`),
  ADD KEY `orders_status_created_at_idx` (`status`,`created_at`);

--
-- Chỉ mục cho bảng `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_items_order_id_product_id_key` (`order_id`,`product_id`),
  ADD KEY `order_items_product_id_idx` (`product_id`);

--
-- Chỉ mục cho bảng `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payments_payment_code_key` (`payment_code`),
  ADD UNIQUE KEY `payments_order_id_key` (`order_id`),
  ADD KEY `payments_user_id_created_at_idx` (`user_id`,`created_at`),
  ADD KEY `payments_status_expired_at_idx` (`status`,`expired_at`);

--
-- Chỉ mục cho bảng `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `products_is_active_idx` (`is_active`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_key` (`email`);

--
-- Chỉ mục cho bảng `webhook_logs`
--
ALTER TABLE `webhook_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `webhook_logs_provider_transaction_id_idx` (`provider_transaction_id`),
  ADD KEY `webhook_logs_status_received_at_idx` (`status`,`received_at`);

--
-- Chỉ mục cho bảng `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `bank_transactions`
--
ALTER TABLE `bank_transactions`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- AUTO_INCREMENT cho bảng `orders`
--
ALTER TABLE `orders`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT cho bảng `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT cho bảng `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT cho bảng `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT cho bảng `webhook_logs`
--
ALTER TABLE `webhook_logs`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- Ràng buộc đối với các bảng kết xuất
--

--
-- Ràng buộc cho bảng `bank_transactions`
--
ALTER TABLE `bank_transactions`
  ADD CONSTRAINT `bank_transactions_payment_id_fkey` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Ràng buộc cho bảng `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Ràng buộc cho bảng `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Ràng buộc cho bảng `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `payments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
