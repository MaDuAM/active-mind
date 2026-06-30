-- migration.sql

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE "Area" AS ENUM ('KNOWLEDGE', 'PASSIVE', 'ACTIVE');
CREATE TYPE "Status" AS ENUM ('WAITING', 'ACTIVE', 'PAUSED');
CREATE TYPE "TrackingType" AS ENUM ('CREATION', 'STEP_CHANGE', 'STATUS_CHANGE', 'ENTRY_EDIT', 'MANUAL', 'RESTORE');

-- ============================================
-- TABLES
-- ============================================

-- User
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Session (für Production mit connect-pg-simple)
CREATE TABLE "session" (
    "sid" VARCHAR NOT NULL COLLATE "default",
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- Topic
CREATE TABLE "Topic" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- Entry
CREATE TABLE "Entry" (
    "id" SERIAL NOT NULL,
    "essenceText" VARCHAR(5000) NOT NULL,
    "essenceShort" VARCHAR(500) NOT NULL,
    "area" "Area" NOT NULL,
    "actionName" VARCHAR(100),
    "benefit" VARCHAR(500),
    "steps" JSONB,
    "status" "Status",
    "pauseReason" VARCHAR(500),
    "currentStepIndex" INTEGER DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "permanentlyRemoved" BOOLEAN NOT NULL DEFAULT false,
    "topicId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- Tracking
CREATE TABLE "Tracking" (
    "id" SERIAL NOT NULL,
    "entryId" INTEGER NOT NULL,
    "trackingType" "TrackingType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" VARCHAR(500),
    "previousStep" VARCHAR(500),
    "newStep" VARCHAR(500),
    "oldStatus" "Status",
    "newStatus" "Status",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tracking_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- INDEXES (Performance-Optimierung)
-- ============================================

-- User
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- Session (für expire-Abfragen)
CREATE INDEX "session_expire_idx" ON "session"("expire");

-- Topic
CREATE UNIQUE INDEX "Topic_userId_name_key" ON "Topic"("userId", "name");
CREATE INDEX "Topic_userId_idx" ON "Topic"("userId");

-- Entry (wichtigste Queries)
CREATE INDEX "Entry_userId_idx" ON "Entry"("userId");
CREATE INDEX "Entry_topicId_idx" ON "Entry"("topicId");
CREATE INDEX "Entry_userId_deletedAt_idx" ON "Entry"("userId", "deletedAt");
CREATE INDEX "Entry_userId_status_idx" ON "Entry"("userId", "status");
CREATE INDEX "Entry_userId_area_idx" ON "Entry"("userId", "area");
CREATE INDEX "Entry_createdAt_idx" ON "Entry"("createdAt" DESC);

-- Tracking
CREATE INDEX "Tracking_entryId_idx" ON "Tracking"("entryId");
CREATE INDEX "Tracking_timestamp_idx" ON "Tracking"("timestamp" DESC);
CREATE INDEX "Tracking_entryId_timestamp_idx" ON "Tracking"("entryId", "timestamp" DESC);

-- ============================================
-- FOREIGN KEYS
-- ============================================

ALTER TABLE "Topic" ADD CONSTRAINT "Topic_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Entry" ADD CONSTRAINT "Entry_topicId_fkey" 
    FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Entry" ADD CONSTRAINT "Entry_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Tracking" ADD CONSTRAINT "Tracking_entryId_fkey" 
    FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;