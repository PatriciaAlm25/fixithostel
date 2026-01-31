-- Migration: Drop RLS policies and fix column types
-- This removes RLS policies that depend on user_id, then changes column types

-- Step 1: Disable RLS on the issues table
ALTER TABLE issues DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies (if they exist)
DROP POLICY IF EXISTS issues_insert ON issues;
DROP POLICY IF EXISTS issues_select ON issues;
DROP POLICY IF EXISTS issues_update ON issues;
DROP POLICY IF EXISTS issues_delete ON issues;

-- Step 3: Change user_id from uuid to text
ALTER TABLE issues
ALTER COLUMN user_id TYPE text;

-- Step 4: Change reported_by from uuid to text (if it was created as uuid)
ALTER TABLE issues
ALTER COLUMN reported_by TYPE text;

-- Verify the changes
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'issues' AND column_name IN ('user_id', 'reported_by')
ORDER BY column_name;
