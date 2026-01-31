-- Migration: Fix reported_by column type
-- The reported_by field stores user IDs that are not in UUID format (they're text like "user_1769496270346")
-- This changes the column from uuid to text

ALTER TABLE issues
ALTER COLUMN reported_by TYPE text;

-- Verify the column type was changed
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'issues' AND column_name = 'reported_by';
