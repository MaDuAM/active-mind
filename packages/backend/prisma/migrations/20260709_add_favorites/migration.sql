-- prisma/migrations/20260709_add_favorites/migration.sql

-- Add isFavorite column to Entry table
ALTER TABLE "Entry" ADD COLUMN "isFavorite" BOOLEAN NOT NULL DEFAULT false;

-- Index for performance (favorite + userId queries)
CREATE INDEX "Entry_userId_isFavorite_idx" ON "Entry"("userId", "isFavorite");