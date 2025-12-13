/*
  Warnings:

  - You are about to drop the column `notes` on the `LedgerEntry` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `LedgerEntry` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LedgerEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "raiderId" INTEGER NOT NULL,
    "item" TEXT NOT NULL,
    "goldSpent" INTEGER NOT NULL,
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
