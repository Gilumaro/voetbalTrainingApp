-- CreateTable
CREATE TABLE "LineupTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "formation" TEXT NOT NULL DEFAULT '4-3-3',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LineupTemplateEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "templateId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STARTER',
    "x" REAL,
    "y" REAL,
    "slot" INTEGER,
    CONSTRAINT "LineupTemplateEntry_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "LineupTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LineupTemplateEntry_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "LineupTemplateEntry_templateId_idx" ON "LineupTemplateEntry"("templateId");

-- CreateIndex
CREATE INDEX "LineupTemplateEntry_playerId_idx" ON "LineupTemplateEntry"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "LineupTemplateEntry_templateId_playerId_key" ON "LineupTemplateEntry"("templateId", "playerId");
