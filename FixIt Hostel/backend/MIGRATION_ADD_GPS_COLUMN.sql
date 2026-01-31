-- Migration: Add missing columns to issues table
-- Run this in Supabase SQL Editor to add GPS and other missing columns

-- Add gps_coordinates column if it doesn't exist
ALTER TABLE issues
ADD COLUMN IF NOT EXISTS gps_coordinates text;

-- Add reported_by column if it doesn't exist
ALTER TABLE issues
ADD COLUMN IF NOT EXISTS reported_by uuid;

-- Add location_text column if it doesn't exist
ALTER TABLE issues
ADD COLUMN IF NOT EXISTS location_text text;

-- Add priority column if it doesn't exist
ALTER TABLE issues
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Normal';

-- Add visibility column if it doesn't exist
ALTER TABLE issues
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'Public';

-- Add images column if it doesn't exist
ALTER TABLE issues
ADD COLUMN IF NOT EXISTS images text;

-- Verify columns were added
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'issues' ORDER BY ordinal_position;
