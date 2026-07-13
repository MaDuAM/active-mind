-- Migration: Volltextsuche-Index für Entry-Tabelle
-- Erstellt GIN-Index für schnelle Volltextsuche über mehrere Felder

-- 1. GIN-Index mit tsvector-Konkatenation (korrigiert)
CREATE INDEX IF NOT EXISTS "Entry_search_idx" ON "Entry"
  USING GIN (
    (to_tsvector('german', COALESCE("essenceText", '')) ||
     to_tsvector('german', COALESCE("essenceShort", '')) ||
     to_tsvector('german', COALESCE("actionName", '')) ||
     to_tsvector('german', COALESCE("benefit", '')))
  );

-- 2. (Optional) Individuelle Indizes für performance
CREATE INDEX IF NOT EXISTS "Entry_essenceText_idx" ON "Entry" 
  USING GIN (to_tsvector('german', COALESCE("essenceText", '')));

CREATE INDEX IF NOT EXISTS "Entry_essenceShort_idx" ON "Entry" 
  USING GIN (to_tsvector('german', COALESCE("essenceShort", '')));