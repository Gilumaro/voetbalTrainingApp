-- AlterTable
ALTER TABLE "Drill" ADD COLUMN "rules" TEXT;
ALTER TABLE "Drill" ADD COLUMN "setup" TEXT;
ALTER TABLE "Drill" ADD COLUMN "steps" TEXT;

-- CreateTable
CREATE TABLE "DrillAction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "drillId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "fromX" REAL NOT NULL,
    "fromY" REAL NOT NULL,
    "toX" REAL NOT NULL,
    "toY" REAL NOT NULL,
    "label" TEXT,
    CONSTRAINT "DrillAction_drillId_fkey" FOREIGN KEY ("drillId") REFERENCES "Drill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DrillAction_drillId_idx" ON "DrillAction"("drillId");
