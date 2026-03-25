/*
  Warnings:

  - You are about to alter the column `guildCut` on the `BoE` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.
  - You are about to alter the column `playerCut` on the `BoE` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.
  - You are about to alter the column `salePrice` on the `BoE` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.
  - You are about to alter the column `goldSpent` on the `LedgerEntry` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BoE" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "armorType" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "looterId" INTEGER NOT NULL,
    "salePrice" BIGINT NOT NULL,
    "playerCut" BIGINT NOT NULL,
    "guildCut" BIGINT NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "dateAdded" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "datePaid" DATETIME,
    "notes" TEXT,
    CONSTRAINT "BoE_looterId_fkey" FOREIGN KEY ("looterId") REFERENCES "Raider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BoE" ("armorType", "dateAdded", "datePaid", "difficulty", "guildCut", "id", "looterId", "notes", "paid", "playerCut", "salePrice", "slot") SELECT "armorType", "dateAdded", "datePaid", "difficulty", "guildCut", "id", "looterId", "notes", "paid", "playerCut", "salePrice", "slot" FROM "BoE";
DROP TABLE "BoE";
ALTER TABLE "new_BoE" RENAME TO "BoE";
CREATE TABLE "new_LedgerEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "raiderId" INTEGER NOT NULL,
    "item" TEXT NOT NULL,
    "goldSpent" BIGINT NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "dateCreated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "datePaid" DATETIME,
    CONSTRAINT "LedgerEntry_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "Raider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LedgerEntry" ("dateCreated", "datePaid", "goldSpent", "id", "item", "paid", "raiderId") SELECT "dateCreated", "datePaid", "goldSpent", "id", "item", "paid", "raiderId" FROM "LedgerEntry";
DROP TABLE "LedgerEntry";
ALTER TABLE "new_LedgerEntry" RENAME TO "LedgerEntry";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
