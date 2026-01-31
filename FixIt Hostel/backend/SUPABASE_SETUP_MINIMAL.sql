-- FixIt Hostel - MINIMAL SQL (Start Here)
-- This is the most basic version - if this fails, we know it's a Supabase config issue
-- Copy and paste ONLY the section between the dashes

-- ============================================================================
-- SECTION 1: CREATE ISSUES TABLE (Copy lines 6-20 ONLY)
-- ============================================================================

CREATE TABLE issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reported_by uuid,
  title text NOT NULL,
  description text,
  category text,
  location text,
  location_text text,
  gps_coordinates text,
  hostel text,
  block text,
  room_no text,
  image_url text,
  image_path text,
  images text[],
  priority text DEFAULT 'Normal',
  visibility text DEFAULT 'Public',
  status text DEFAULT 'Reported',
  assigned_to uuid,
  assigned_at timestamp,
  resolved_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- ============================================================================
-- SECTION 2: CREATE LOST & FOUND TABLE (Copy lines 27-45 ONLY)
-- ============================================================================

CREATE TABLE lost_found_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_type text NOT NULL,
  item_name text NOT NULL,
  description text,
  category text,
  location text,
  hostel text,
  block text,
  room_no text,
  image_url text,
  image_path text,
  status text DEFAULT 'Open',
  assigned_to uuid,
  assigned_at timestamp,
  resolved_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- ============================================================================
-- SECTION 3: CREATE ANNOUNCEMENTS TABLE (Copy lines 52-65 ONLY)
-- ============================================================================

CREATE TABLE announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  management_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  hostel text,
  priority text DEFAULT 'Normal',
  attachment_url text,
  attachment_path text,
  published boolean DEFAULT true,
  published_at timestamp DEFAULT now(),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- ============================================================================
-- SECTION 4: ADD INDEXES (Copy lines 72-82 ONLY)
-- ============================================================================

CREATE INDEX idx_issues_user_id ON issues(user_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_lost_found_user_id ON lost_found_items(user_id);
CREATE INDEX idx_lost_found_status ON lost_found_items(status);
CREATE INDEX idx_announcements_management_id ON announcements(management_id);

-- ============================================================================
-- SECTION 5: ENABLE RLS (Copy lines 89-93 ONLY)
-- ============================================================================

ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_found_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 6: CREATE FUNCTION (Copy lines 100-109 ONLY)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 7: CREATE TRIGGERS (Copy lines 116-128 ONLY)
-- ============================================================================

CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lost_found_updated_at BEFORE UPDATE ON lost_found_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 8: RLS POLICIES - ISSUES (Copy lines 135-158 ONLY)
-- ============================================================================

CREATE POLICY issues_select ON issues FOR SELECT USING (true);
CREATE POLICY issues_insert ON issues FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY issues_update ON issues FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = assigned_to);
CREATE POLICY issues_delete ON issues FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 9: RLS POLICIES - LOST & FOUND (Copy lines 165-178 ONLY)
-- ============================================================================

CREATE POLICY lost_found_select ON lost_found_items FOR SELECT USING (true);
CREATE POLICY lost_found_insert ON lost_found_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY lost_found_update ON lost_found_items FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = assigned_to);
CREATE POLICY lost_found_delete ON lost_found_items FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 10: RLS POLICIES - ANNOUNCEMENTS (Copy lines 185-189 ONLY)
-- ============================================================================

CREATE POLICY announcements_select ON announcements FOR SELECT USING (published = true);
CREATE POLICY announcements_insert ON announcements FOR INSERT WITH CHECK (auth.uid() = management_id);
CREATE POLICY announcements_update ON announcements FOR UPDATE USING (management_id = auth.uid());
CREATE POLICY announcements_delete ON announcements FOR DELETE USING (management_id = auth.uid());
