/*
  Warnings:

  - You are about to drop the column `tank_capacity` on the `works` table. All the data in the column will be lost.
  - You are about to drop the column `tank_type` on the `works` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "companies" ADD COLUMN "memo" TEXT;
ALTER TABLE "companies" ADD COLUMN "phone" TEXT;

-- CreateTable
CREATE TABLE "tanks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "site_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "capacity" REAL NOT NULL,
    "tank_type" TEXT,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tanks_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "work_tanks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_id" TEXT NOT NULL,
    "tank_id" TEXT NOT NULL,
    CONSTRAINT "work_tanks_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "works" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "work_tanks_tank_id_fkey" FOREIGN KEY ("tank_id") REFERENCES "tanks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_works" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "site_id" TEXT NOT NULL,
    "title" TEXT,
    "work_date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "duration_hours" REAL,
    "required_people" INTEGER,
    "difficulty" INTEGER,
    "equipment" TEXT,
    "notes" TEXT,
    "caution" TEXT,
    "memo" TEXT,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "works_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "works_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "works_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_works" ("caution", "created_at", "created_by", "difficulty", "duration_hours", "equipment", "id", "memo", "notes", "required_people", "site_id", "status", "title", "updated_at", "updated_by", "work_date") SELECT "caution", "created_at", "created_by", "difficulty", "duration_hours", "equipment", "id", "memo", "notes", "required_people", "site_id", "status", "title", "updated_at", "updated_by", "work_date" FROM "works";
DROP TABLE "works";
ALTER TABLE "new_works" RENAME TO "works";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "work_tanks_work_id_tank_id_key" ON "work_tanks"("work_id", "tank_id");
