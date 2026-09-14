-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "bigGoals" INTEGER NOT NULL DEFAULT 2,
    "smallGoals" INTEGER NOT NULL DEFAULT 4,
    "discCones" INTEGER NOT NULL DEFAULT 40,
    "cones" INTEGER NOT NULL DEFAULT 20,
    "pinnies" INTEGER NOT NULL DEFAULT 16,
    "balls" INTEGER NOT NULL DEFAULT 16,
    "pitchX" REAL NOT NULL DEFAULT 50,
    "pitchY" REAL NOT NULL DEFAULT 35,
    "trainingDays" TEXT NOT NULL DEFAULT '[]',
    "defaultAgeCategory" TEXT NOT NULL DEFAULT 'U15',
    "defaultDurationMin" INTEGER NOT NULL DEFAULT 75,
    "defaultPlayers" INTEGER NOT NULL DEFAULT 16,
    "defaultSpaceType" TEXT NOT NULL DEFAULT 'HALF',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("balls", "bigGoals", "cones", "discCones", "id", "pinnies", "pitchX", "pitchY", "smallGoals", "updatedAt") SELECT "balls", "bigGoals", "cones", "discCones", "id", "pinnies", "pitchX", "pitchY", "smallGoals", "updatedAt" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
