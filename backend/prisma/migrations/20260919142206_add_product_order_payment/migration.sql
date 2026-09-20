/*
  Warnings:

  - A unique constraint covering the columns `[order_id]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `payments` 
    ADD COLUMN `method` 
        ENUM('BANK_TRANSFER', 'BALANCE') 
        NOT NULL DEFAULT 'BANK_TRANSFER',
    ADD COLUMN `order_id` BIGINT NULL,
    MODIFY `status` 
        ENUM('PENDING', 'PAID', 'EXPIRED', 'FAILED', 'CANCELLED') 
        NOT NULL DEFAULT 'PENDING',
    MODIFY `expired_at` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `products` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `price` BIGINT NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `products_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `checkout_key` VARCHAR(36) NOT NULL,
    `request_hash` VARCHAR(64) NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `total_amount` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `paid_at` DATETIME(3) NULL,
    `cancelled_at` DATETIME(3) NULL,

    INDEX `orders_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `orders_status_created_at_idx`(`status`, `created_at`),
    UNIQUE INDEX `orders_user_id_checkout_key_key`(`user_id`, `checkout_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT NOT NULL,
    `product_id` BIGINT NOT NULL,
    `product_name_snapshot` VARCHAR(255) NOT NULL,
    `unit_price_snapshot` BIGINT NOT NULL,
    `quantity` INTEGER NOT NULL,
    `subtotal` BIGINT NOT NULL,

    INDEX `order_items_product_id_idx`(`product_id`),
    UNIQUE INDEX `order_items_order_id_product_id_key`(`order_id`, `product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `payments_order_id_key` ON `payments`(`order_id`);

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
