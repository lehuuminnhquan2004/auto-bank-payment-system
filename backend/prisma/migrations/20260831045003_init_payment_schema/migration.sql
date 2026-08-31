-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `balance` BIGINT NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `payment_code` VARCHAR(32) NOT NULL,
    `amount` BIGINT NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'EXPIRED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `expired_at` DATETIME(3) NOT NULL,
    `paid_at` DATETIME(3) NULL,

    UNIQUE INDEX `payments_payment_code_key`(`payment_code`),
    INDEX `payments_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `payments_status_expired_at_idx`(`status`, `expired_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bank_transactions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `provider` VARCHAR(50) NOT NULL,
    `provider_transaction_id` VARCHAR(255) NOT NULL,
    `payment_id` BIGINT NULL,
    `bank` VARCHAR(100) NOT NULL,
    `transfer_type` ENUM('IN', 'OUT') NOT NULL,
    `amount` BIGINT NOT NULL,
    `content` TEXT NOT NULL,
    `transaction_time` DATETIME(3) NULL,
    `raw_payload` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `bank_transactions_payment_id_key`(`payment_id`),
    INDEX `bank_transactions_transaction_time_idx`(`transaction_time`),
    UNIQUE INDEX `bank_transactions_provider_provider_transaction_id_key`(`provider`, `provider_transaction_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webhook_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `provider` VARCHAR(50) NOT NULL,
    `provider_transaction_id` VARCHAR(255) NULL,
    `payload` JSON NOT NULL,
    `status` ENUM('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED', 'DUPLICATE') NOT NULL DEFAULT 'RECEIVED',
    `received_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processed_at` DATETIME(3) NULL,
    `error_message` TEXT NULL,

    INDEX `webhook_logs_provider_transaction_id_idx`(`provider_transaction_id`),
    INDEX `webhook_logs_status_received_at_idx`(`status`, `received_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_transactions` ADD CONSTRAINT `bank_transactions_payment_id_fkey` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
