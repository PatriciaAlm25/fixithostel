-- FixIt Hostel Supabase Database Setup (SIMPLIFIED)
-- Run this SQL in the Supabase SQL Editor to create all required tables and policies
-- This version is simplified to avoid foreign key issues with auth.users

-- ============================================================================
-- 1. ISSUES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.issues (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  location TEXT,
  hostel TEXT,
  block TEXT,
  room_no TEXT,
  image_url TEXT,
  image_path TEXT,
  status TEXT DEFAULT 'Reported' CHECK (status IN ('Reported', 'Assigned', 'In Progress', 'Resolved')),
  assigned_to uuid,
  assigned_at TIMESTAMP,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issues_user_id ON public.issues(user_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_hostel ON public.issues(hostel);
CREATE INDEX IF NOT EXISTS idx_issues_assigned_to ON public.issues(assigned_to);

-- Enable RLS
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read issues
CREATE POLICY "Issues are viewable by everyone" ON public.issues
  FOR SELECT USING (true);

-- Policy: Users can create issues
CREATE POLICY "Users can create issues" ON public.issues
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own issues or if assigned to them
CREATE POLICY "Users can update own issues" ON public.issues
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = assigned_to);

-- Policy: Users can delete their own issues
CREATE POLICY "Users can delete own issues" ON public.issues
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 2. LOST & FOUND ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.lost_found_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('Lost', 'Found')),
  item_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  location TEXT,
  hostel TEXT,
  block TEXT,
  room_no TEXT,
  image_url TEXT,
  image_path TEXT,
  status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Claimed', 'Resolved')),
  assigned_to uuid,
  assigned_at TIMESTAMP,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lost_found_user_id ON public.lost_found_items(user_id);
CREATE INDEX IF NOT EXISTS idx_lost_found_type ON public.lost_found_items(item_type);
CREATE INDEX IF NOT EXISTS idx_lost_found_status ON public.lost_found_items(status);
CREATE INDEX IF NOT EXISTS idx_lost_found_hostel ON public.lost_found_items(hostel);
CREATE INDEX IF NOT EXISTS idx_lost_found_assigned_to ON public.lost_found_items(assigned_to);

-- Enable RLS
ALTER TABLE public.lost_found_items ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read items
CREATE POLICY "Items are viewable by everyone" ON public.lost_found_items
  FOR SELECT USING (true);

-- Policy: Users can create items
CREATE POLICY "Users can create items" ON public.lost_found_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own items or if assigned to them
CREATE POLICY "Users can update own items" ON public.lost_found_items
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = assigned_to);

-- Policy: Users can delete their own items
CREATE POLICY "Users can delete own items" ON public.lost_found_items
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 3. ANNOUNCEMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  management_id uuid NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  hostel TEXT,
  priority TEXT DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Critical')),
  attachment_url TEXT,
  attachment_path TEXT,
  published BOOLEAN DEFAULT true,
  published_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_management_id ON public.announcements(management_id);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON public.announcements(published);
CREATE INDEX IF NOT EXISTS idx_announcements_hostel ON public.announcements(hostel);
CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON public.announcements(published_at);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read published announcements
CREATE POLICY "Announcements are viewable by everyone" ON public.announcements
  FOR SELECT USING (published = true);

-- Policy: Only management owner can create announcements
CREATE POLICY "Management can create announcements" ON public.announcements
  FOR INSERT WITH CHECK (auth.uid() = management_id);

-- Policy: Only management owner can update
CREATE POLICY "Management can update own announcements" ON public.announcements
  FOR UPDATE USING (management_id = auth.uid());

-- Policy: Only management owner can delete
CREATE POLICY "Management can delete own announcements" ON public.announcements
  FOR DELETE USING (management_id = auth.uid());

-- ============================================================================
-- 4. AUTO-UPDATE TRIGGER FOR UPDATED_AT
-- ============================================================================

-- Drop existing function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_issues_updated_at 
  BEFORE UPDATE ON public.issues
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lost_found_updated_at 
  BEFORE UPDATE ON public.lost_found_items
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at 
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 5. STORAGE BUCKETS (Create via Supabase Dashboard)
-- ============================================================================
-- You need to create these storage buckets manually in Supabase Dashboard:
-- 1. issue-images (set to PUBLIC)
-- 2. lost-found-images (set to PUBLIC)
-- 3. announcement-attachments (set to PUBLIC)

-- ============================================================================
-- 6. STORAGE RLS POLICIES (Run these AFTER creating buckets)
-- ============================================================================
-- Go to Storage > [bucket-name] > Policies and add:

-- For authenticated users to upload:
-- CREATE POLICY "Authenticated users can upload"
-- ON storage.objects
-- FOR INSERT
-- WITH CHECK (
--   bucket_id = '[bucket-name]'
--   AND auth.role() = 'authenticated'
-- );

-- For public read access:
-- CREATE POLICY "Public read access"
-- ON storage.objects
-- FOR SELECT
-- USING (bucket_id = '[bucket-name]');

-- ============================================================================
-- 7. VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify your setup:

-- Check if tables were created
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Check issues table
-- SELECT COUNT(*) as issues_count FROM public.issues;

-- Check lost_found_items table
-- SELECT COUNT(*) as lost_found_count FROM public.lost_found_items;

-- Check announcements table
-- SELECT COUNT(*) as announcements_count FROM public.announcements;

-- ============================================================================
-- NOTES
-- ============================================================================
-- - Removed foreign key constraints with auth.users to avoid compatibility issues
-- - All user_id fields accept UUID values from Supabase Authentication
-- - RLS policies check auth.uid() against user_id fields
-- - Storage buckets must be created manually in Supabase Dashboard
-- - Storage RLS policies must be added manually after bucket creation
-- - The update_updated_at_column function automatically sets updated_at timestamp
