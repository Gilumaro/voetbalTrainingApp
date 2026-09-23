-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "label" TEXT,
    "ageCategory" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "players" INTEGER NOT NULL,
    "spaceType" TEXT NOT NULL,
    "notes" TEXT,
    "attendanceConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Session" ("ageCategory", "createdAt", "date", "durationMin", "id", "label", "notes", "players", "spaceType", "theme") SELECT "ageCategory", "createdAt", "date", "durationMin", "id", "label", "notes", "players", "spaceType", "theme" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
