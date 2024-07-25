-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `login` TEXT NOT NULL,
    `password` TEXT NOT NULL,
    `role` TEXT NOT NULL,
    `DateOfReg` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `Salary` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
