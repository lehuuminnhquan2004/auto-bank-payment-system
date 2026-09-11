-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Máy chủ: mysql:3306
-- Thời gian đã tạo: Th9 11, 2026 lúc 04:38 PM
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
(60, 'SEPAY', '30860', 36, 'MBBank', 'IN', 1000000, 'PAYDAE9D18E7CC5', '2026-09-10 17:25:08.000', '{\"id\": 30860, \"code\": \"\", \"content\": \"PAYDAE9D18E7CC5\", \"gateway\": \"MBBank\", \"subAccount\": \"\", \"accumulated\": 0, \"description\": \"PAYDAE9D18E7CC5\", \"transferType\": \"in\", \"accountNumber\": \"0328421191\", \"referenceCode\": \"SB3386C882F152\", \"transferAmount\": 1000000, \"transactionDate\": \"2026-09-11 00:25:08\"}', '2026-09-10 17:25:12.273');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `payments`
--

CREATE TABLE `payments` (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `payment_code` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` bigint NOT NULL,
  `status` enum('PENDING','PAID','EXPIRED','FAILED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `expired_at` datetime(3) NOT NULL,
  `paid_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `payments`
--

INSERT INTO `payments` (`id`, `user_id`, `payment_code`, `amount`, `status`, `created_at`, `updated_at`, `expired_at`, `paid_at`) VALUES
(15, 5, 'PAYE2908B9B3011', 100000, 'PENDING', '2026-09-06 04:26:39.463', '2026-09-06 04:26:39.463', '2026-09-06 04:41:39.449', NULL),
(16, 5, 'PAY90FBD5E17608', 100000, 'PENDING', '2026-09-06 04:27:54.853', '2026-09-06 04:27:54.853', '2026-09-06 04:42:54.851', NULL),
(18, 5, 'PAY818B94FF592F', 100000, 'PENDING', '2026-09-06 04:30:35.622', '2026-09-06 04:30:35.622', '2026-09-06 04:45:35.607', NULL),
(29, 5, 'PAY29B5866BAF45', 100000, 'PAID', '2026-09-09 17:42:36.480', '2026-09-09 17:43:09.426', '2026-09-09 17:57:36.463', '2026-09-09 17:43:09.421'),
(30, 32, 'PAY034579D25435', 100000, 'PAID', '2026-09-10 07:32:22.730', '2026-09-10 07:32:42.934', '2026-09-10 07:47:22.725', '2026-09-10 07:32:42.933'),
(31, 32, 'PAYCFF325CC3038', 10000, 'EXPIRED', '2026-09-10 08:33:17.568', '2026-09-10 08:40:19.494', '2026-09-10 08:40:17.565', NULL),
(32, 32, 'PAY2DA6BC4BE601', 10000, 'PAID', '2026-09-10 12:27:23.765', '2026-09-10 12:27:53.390', '2026-09-10 12:42:23.755', '2026-09-10 12:27:53.386'),
(33, 32, 'PAY19AB1DF98AE1', 100000, 'EXPIRED', '2026-09-10 16:43:32.702', '2026-09-10 16:58:33.216', '2026-09-10 16:58:32.698', NULL),
(34, 32, 'PAY5BBAA735E7F2', 1000000, 'PAID', '2026-09-10 17:10:32.632', '2026-09-10 17:11:26.669', '2026-09-10 17:25:32.630', '2026-09-10 17:11:26.669'),
(35, 34, 'PAY0F6F8FFAFF41', 10000, 'PENDING', '2026-09-10 17:15:24.975', '2026-09-10 17:15:24.975', '2026-09-10 17:30:24.973', NULL),
(36, 32, 'PAYDAE9D18E7CC5', 10000, 'PAID', '2026-09-10 17:24:52.198', '2026-09-10 17:25:12.496', '2026-09-10 17:39:52.186', '2026-09-10 17:25:12.495');

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
(5, 'test@example.com', '$argon2id$v=19$m=65536,p=4,t=3$dXWLAHC0u5HSQpZBKHg4eA$aSI9jMrMVFr58ZL0/f3mg2S+6Bn/9Zu40aQ43sP78ZA', 100000, '2026-09-01 09:33:09.596', '2026-09-09 17:43:09.508'),
(32, 'test2@gmail.com', '$argon2id$v=19$m=65536,p=4,t=3$CmK1ob3wzz2tZopO5uy1iA$0nStGpD71ljunB8FA8Cc7qYEQNEuqMeT7roQLeufQE0', 1120000, '2026-09-10 06:47:16.935', '2026-09-10 17:25:12.584'),
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
(35, 'SEPAY', '30860', '{\"id\": 30860, \"code\": \"\", \"content\": \"PAYDAE9D18E7CC5\", \"gateway\": \"MBBank\", \"subAccount\": \"\", \"accumulated\": 0, \"description\": \"PAYDAE9D18E7CC5\", \"transferType\": \"in\", \"accountNumber\": \"0328421191\", \"referenceCode\": \"SB3386C882F152\", \"transferAmount\": 1000000, \"transactionDate\": \"2026-09-11 00:25:08\"}', 'PROCESSED', '2026-09-10 17:25:12.175', '2026-09-10 17:25:12.495', NULL);

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
('8c3e5c1c-0617-4b78-bd51-3399ef437ee6', 'eb393abd70b521e08fa4d2f7e633e37230a50b8cf942f638d5c35bb373a68825', '2026-08-31 05:06:53.762', '20260831045003_init_payment_schema', NULL, NULL, '2026-08-31 05:06:53.465', 1);

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
-- Chỉ mục cho bảng `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payments_payment_code_key` (`payment_code`),
  ADD KEY `payments_user_id_created_at_idx` (`user_id`,`created_at`),
  ADD KEY `payments_status_expired_at_idx` (`status`,`expired_at`);

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
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT cho bảng `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT cho bảng `webhook_logs`
--
ALTER TABLE `webhook_logs`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- Ràng buộc đối với các bảng kết xuất
--

--
-- Ràng buộc cho bảng `bank_transactions`
--
ALTER TABLE `bank_transactions`
  ADD CONSTRAINT `bank_transactions_payment_id_fkey` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Ràng buộc cho bảng `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
