-- CreateTable
CREATE TABLE "Raider" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "discordId" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "raiderId" INTEGER NOT NULL,
    "item" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "goldSpent" INTEGER NOT NULL,
    "notes" TEXT,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "dateCreated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "datePaid" DATETIME,
    CONSTRAINT "LedgerEntry_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "Raider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Raider_discordId_key" ON "Raider"("discordId");
