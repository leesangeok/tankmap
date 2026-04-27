-- CreateTable
CREATE TABLE "tank_photos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tank_id" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "caption" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tank_photos_tank_id_fkey" FOREIGN KEY ("tank_id") REFERENCES "tanks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tank_photos_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
