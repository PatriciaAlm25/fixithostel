-- FixIt Hostel - CLEAN START (DROP & RECREATE)
-- This will remove existing tables and create them fresh

-- ============================================================================
-- STEP 1: DROP EXISTING TABLES (if they exist)
-- ============================================================================

DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS lost_found_items CASCADE;
DROP TABLE IF EXISTS issues CASCADE;

-- ============================================================================
-- STEP 2: CREATE ISSUES TABLE
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
-- STEP 3: CREATE LOST & FOUND TABLE
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
-- STEP 4: CREATE ANNOUNCEMENTS TABLE
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
-- STEP 5: CREATE INDEXES
-- ============================================================================

CREATE INDEX idx_issues_user_id ON issues(user_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_lost_found_user_id ON lost_found_items(user_id);
CREATE INDEX idx_lost_found_status ON lost_found_items(status);
CREATE INDEX idx_announcements_management_id ON announcements(management_id);

-- ============================================================================
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_found_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 7: CREATE FUNCTION FOR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 8: CREATE TRIGGERS
-- ============================================================================

CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lost_found_updated_at BEFORE UPDATE ON lost_found_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 9: RLS POLICIES - ISSUES
-- ============================================================================

CREATE POLICY issues_select ON issues FOR SELECT USING (true);
CREATE POLICY issues_insert ON issues FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY issues_update ON issues FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = assigned_to);
CREATE POLICY issues_delete ON issues FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 10: RLS POLICIES - LOST & FOUND
-- ============================================================================

CREATE POLICY lost_found_select ON lost_found_items FOR SELECT USING (true);
CREATE POLICY lost_found_insert ON lost_found_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY lost_found_update ON lost_found_items FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = assigned_to);
CREATE POLICY lost_found_delete ON lost_found_items FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 11: RLS POLICIES - ANNOUNCEMENTS
-- ============================================================================

CREATE POLICY announcements_select ON announcements FOR SELECT USING (published = true);
CREATE POLICY announcements_insert ON announcements FOR INSERT WITH CHECK (auth.uid() = management_id);
CREATE POLICY announcements_update ON announcements FOR UPDATE USING (management_id = auth.uid());
CREATE POLICY announcements_delete ON announcements FOR DELETE USING (management_id = auth.uid());

-- ============================================================================
-- DONE! All tables created with RLS enabled
-- ============================================================================
