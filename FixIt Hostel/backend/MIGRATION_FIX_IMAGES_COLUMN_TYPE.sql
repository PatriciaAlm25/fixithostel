-- Migration: Fix images column type
-- The images column was created as text[] (array) but we store JSON strings
-- This causes "malformed array literal" errors

-- Change images column from text[] to text to store JSON strings
ALTER TABLE issues
ALTER COLUMN images TYPE text;

-- Verify the change
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'issues' AND column_name = 'images';
