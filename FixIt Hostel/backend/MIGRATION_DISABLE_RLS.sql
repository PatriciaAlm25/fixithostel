-- Migration: Disable RLS on issues table for development
-- This allows users to create and view issues without RLS policy restrictions

-- Disable RLS on issues table
ALTER TABLE issues DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'issues';
