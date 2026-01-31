-- FixIt Hostel Supabase Database Setup
-- Run this SQL in the Supabase SQL Editor to create all required tables and policies

-- ============================================================================
-- 1. ISSUES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS issues (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_issues_user_id ON issues(user_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_hostel ON issues(hostel);
CREATE INDEX idx_issues_assigned_to ON issues(assigned_to);

-- Enable RLS
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read issues
CREATE POLICY "Issues are viewable by everyone" ON issues
  FOR SELECT USING (true);

-- Policy: Users can create issues
CREATE POLICY "Users can create issues" ON issues
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own issues
CREATE POLICY "Users can update own issues" ON issues
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = assigned_to);

-- Policy: Users can delete their own issues
CREATE POLICY "Users can delete own issues" ON issues
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 2. LOST & FOUND ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS lost_found_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lost_found_user_id ON lost_found_items(user_id);
CREATE INDEX idx_lost_found_type ON lost_found_items(item_type);
CREATE INDEX idx_lost_found_status ON lost_found_items(status);
CREATE INDEX idx_lost_found_hostel ON lost_found_items(hostel);
CREATE INDEX idx_lost_found_assigned_to ON lost_found_items(assigned_to);

-- Enable RLS
ALTER TABLE lost_found_items ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read items
CREATE POLICY "Items are viewable by everyone" ON lost_found_items
  FOR SELECT USING (true);

-- Policy: Users can create items
CREATE POLICY "Users can create items" ON lost_found_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own items
CREATE POLICY "Users can update own items" ON lost_found_items
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = assigned_to);

-- Policy: Users can delete their own items
CREATE POLICY "Users can delete own items" ON lost_found_items
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 3. ANNOUNCEMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS announcements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  management_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

CREATE INDEX idx_announcements_management_id ON announcements(management_id);
CREATE INDEX idx_announcements_published ON announcements(published);
CREATE INDEX idx_announcements_hostel ON announcements(hostel);
CREATE INDEX idx_announcements_published_at ON announcements(published_at);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read published announcements
CREATE POLICY "Announcements are viewable by everyone" ON announcements
  FOR SELECT USING (published = true);

-- Policy: Only management can create announcements
-- Note: Adjust this if you have a different users table structure
CREATE POLICY "Only management can create announcements" ON announcements
  FOR INSERT WITH CHECK (auth.uid() = management_id);

-- Policy: Only management owner can update/delete
CREATE POLICY "Management can update own announcements" ON announcements
  FOR UPDATE USING (management_id = auth.uid());

CREATE POLICY "Management can delete own announcements" ON announcements
  FOR DELETE USING (management_id = auth.uid());

-- ============================================================================
-- 4. AUTO-UPDATE TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lost_found_updated_at BEFORE UPDATE ON lost_found_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. STORAGE BUCKETS (Create via Supabase Dashboard or via API)
-- ============================================================================
-- You need to create these storage buckets manually in Supabase Dashboard:
-- 1. issue-images (public)
-- 2. lost-found-images (public)
-- 3. announcement-attachments (public)
--
-- Or use Supabase SDK to create them programmatically

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify your setup:

-- Check issues table
-- SELECT COUNT(*) as issues_count FROM issues;

-- Check lost_found_items table
-- SELECT COUNT(*) as lost_found_count FROM lost_found_items;

-- Check announcements table
-- SELECT COUNT(*) as announcements_count FROM announcements;

-- List all tables
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';
