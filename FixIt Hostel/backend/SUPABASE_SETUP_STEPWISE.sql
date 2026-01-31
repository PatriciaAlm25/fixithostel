-- FixIt Hostel Supabase Database Setup (STEP-BY-STEP)
-- Run EACH SECTION separately, not all at once
-- This helps identify where the error occurs

-- ============================================================================
-- SECTION 1: CREATE ISSUES TABLE (Run this first)
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

-- ============================================================================
-- SECTION 2: CREATE LOST & FOUND TABLE (Run this second)
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

-- ============================================================================
-- SECTION 3: CREATE ANNOUNCEMENTS TABLE (Run this third)
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

-- ============================================================================
-- SECTION 4: ENABLE RLS ON TABLES (Run this fourth)
-- ============================================================================

ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_found_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 5: CREATE AUTO-UPDATE FUNCTION (Run this fifth)
-- ============================================================================

DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 6: CREATE TRIGGERS (Run this sixth)
-- ============================================================================

DROP TRIGGER IF EXISTS update_issues_updated_at ON public.issues;
DROP TRIGGER IF EXISTS update_lost_found_updated_at ON public.lost_found_items;
DROP TRIGGER IF EXISTS update_announcements_updated_at ON public.announcements;

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
-- SECTION 7: RLS POLICIES FOR ISSUES (Run this seventh)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Issues are viewable by everyone" ON public.issues;
DROP POLICY IF EXISTS "Users can create issues" ON public.issues;
DROP POLICY IF EXISTS "Users can update own issues" ON public.issues;
DROP POLICY IF EXISTS "Users can delete own issues" ON public.issues;

-- Create new policies
CREATE POLICY "Issues are viewable by everyone" 
  ON public.issues
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create issues" 
  ON public.issues
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own issues" 
  ON public.issues
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = assigned_to)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = assigned_to);

CREATE POLICY "Users can delete own issues" 
  ON public.issues
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 8: RLS POLICIES FOR LOST & FOUND (Run this eighth)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Items are viewable by everyone" ON public.lost_found_items;
DROP POLICY IF EXISTS "Users can create items" ON public.lost_found_items;
DROP POLICY IF EXISTS "Users can update own items" ON public.lost_found_items;
DROP POLICY IF EXISTS "Users can delete own items" ON public.lost_found_items;

-- Create new policies
CREATE POLICY "Items are viewable by everyone" 
  ON public.lost_found_items
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create items" 
  ON public.lost_found_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items" 
  ON public.lost_found_items
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = assigned_to)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = assigned_to);

CREATE POLICY "Users can delete own items" 
  ON public.lost_found_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 9: RLS POLICIES FOR ANNOUNCEMENTS (Run this ninth)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Announcements are viewable by everyone" ON public.announcements;
DROP POLICY IF EXISTS "Management can create announcements" ON public.announcements;
DROP POLICY IF EXISTS "Management can update own announcements" ON public.announcements;
DROP POLICY IF EXISTS "Management can delete own announcements" ON public.announcements;

-- Create new policies
CREATE POLICY "Announcements are viewable by everyone" 
  ON public.announcements
  FOR SELECT
  USING (published = true);

CREATE POLICY "Management can create announcements" 
  ON public.announcements
  FOR INSERT
  WITH CHECK (auth.uid() = management_id);

CREATE POLICY "Management can update own announcements" 
  ON public.announcements
  FOR UPDATE
  USING (management_id = auth.uid())
  WITH CHECK (management_id = auth.uid());

CREATE POLICY "Management can delete own announcements" 
  ON public.announcements
  FOR DELETE
  USING (management_id = auth.uid());

-- ============================================================================
-- VERIFICATION: Check all tables exist
-- ============================================================================

-- Run this to verify everything was created:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('issues', 'lost_found_items', 'announcements');
