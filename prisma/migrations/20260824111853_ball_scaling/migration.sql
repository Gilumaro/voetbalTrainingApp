-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Drill" (
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
    "ballScaling" TEXT NOT NULL DEFAULT 'FIXED',
    "description" TEXT NOT NULL,
    "coachingPoints" TEXT,
    "progressions" TEXT,
    "simplifications" TEXT,
    "videoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Drill" ("ageMax", "ageMin", "coachingPoints", "createdAt", "description", "durationMin", "fieldType", "footprintX", "footprintY", "id", "idealPlayers", "maxPlayers", "minPlayers", "progressions", "simplifications", "theme", "title", "type", "updatedAt", "videoUrl") SELECT "ageMax", "ageMin", "coachingPoints", "createdAt", "description", "durationMin", "fieldType", "footprintX", "footprintY", "id", "idealPlayers", "maxPlayers", "minPlayers", "progressions", "simplifications", "theme", "title", "type", "updatedAt", "videoUrl" FROM "Drill";
DROP TABLE "Drill";
ALTER TABLE "new_Drill" RENAME TO "Drill";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
