-- CreateTable
CREATE TABLE "Player" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "shirtNumber" INTEGER,
    "preferredPosition" TEXT NOT NULL,
    "secondaryPosition" TEXT,
    "birthDate" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PlayerComment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "playerId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "text" TEXT NOT NULL,
    CONSTRAINT "PlayerComment_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrainingEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "label" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "eventId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "present" BOOLEAN NOT NULL DEFAULT true,
    "didCleanup" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Attendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TrainingEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attendance_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Match" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "opponent" TEXT NOT NULL,
    "homeAway" TEXT NOT NULL DEFAULT 'THUIS',
    "formation" TEXT NOT NULL DEFAULT '4-3-3',
    "location" TEXT,
    "result" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LineupEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matchId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'BENCH',
    "x" REAL,
    "y" REAL,
    "slot" INTEGER,
    CONSTRAINT "LineupEntry_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LineupEntry_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PlayerComment_playerId_idx" ON "PlayerComment"("playerId");

-- CreateIndex
CREATE INDEX "Attendance_eventId_idx" ON "Attendance"("eventId");

-- CreateIndex
CREATE INDEX "Attendance_playerId_idx" ON "Attendance"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_eventId_playerId_key" ON "Attendance"("eventId", "playerId");

-- CreateIndex
CREATE INDEX "LineupEntry_matchId_idx" ON "LineupEntry"("matchId");

-- CreateIndex
CREATE INDEX "LineupEntry_playerId_idx" ON "LineupEntry"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "LineupEntry_matchId_playerId_key" ON "LineupEntry"("matchId", "playerId");
