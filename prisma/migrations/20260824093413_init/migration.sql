-- CreateTable
CREATE TABLE "Drill" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "ageMin" INTEGER NOT NULL DEFAULT 15,
    "ageMax" INTEGER NOT NULL DEFAULT 15,
    "fieldType" TEXT NOT NULL,
    "footprintX" REAL NOT NULL,
    "footprintY" REAL NOT NULL,
    "minPlayers" INTEGER NOT NULL,
    "idealPlayers" INTEGER NOT NULL,
    "maxPlayers" INTEGER NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "coachingPoints" TEXT,
    "progressions" TEXT,
    "simplifications" TEXT,
    "videoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DrillAid" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "drillId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "x" REAL NOT NULL,
    "y" REAL NOT NULL,
    "rotation" REAL NOT NULL DEFAULT 0,
    "label" TEXT,
    CONSTRAINT "DrillAid_drillId_fkey" FOREIGN KEY ("drillId") REFERENCES "Drill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "label" TEXT,
    "ageCategory" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "players" INTEGER NOT NULL,
    "spaceType" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SessionBlock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "label" TEXT,
    CONSTRAINT "SessionBlock_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BlockStation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "blockId" INTEGER NOT NULL,
    "drillId" INTEGER NOT NULL,
    "group" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "placementOverrides" TEXT,
    CONSTRAINT "BlockStation_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "SessionBlock" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BlockStation_drillId_fkey" FOREIGN KEY ("drillId") REFERENCES "Drill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "bigGoals" INTEGER NOT NULL DEFAULT 2,
    "smallGoals" INTEGER NOT NULL DEFAULT 4,
    "discCones" INTEGER NOT NULL DEFAULT 40,
    "cones" INTEGER NOT NULL DEFAULT 20,
    "pinnies" INTEGER NOT NULL DEFAULT 16,
    "balls" INTEGER NOT NULL DEFAULT 16,
    "pitchX" REAL NOT NULL DEFAULT 50,
    "pitchY" REAL NOT NULL DEFAULT 35,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "DrillAid_drillId_idx" ON "DrillAid"("drillId");

-- CreateIndex
CREATE INDEX "SessionBlock_sessionId_idx" ON "SessionBlock"("sessionId");

-- CreateIndex
CREATE INDEX "BlockStation_blockId_idx" ON "BlockStation"("blockId");

-- CreateIndex
CREATE INDEX "BlockStation_drillId_idx" ON "BlockStation"("drillId");
