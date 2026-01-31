-- Migration: Fix user_id column type
-- Change user_id from uuid to text to support text-based user IDs

ALTER TABLE issues
ALTER COLUMN user_id TYPE text;

-- Verify the column type was changed
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'issues' AND column_name = 'user_id';
