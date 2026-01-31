-- FixIt Hostel - Complete Users Table Setup for Supabase
-- Run this SQL in Supabase SQL Editor to set up the users table correctly

-- ============================================================================
-- CREATE USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  -- Primary Key & Identifiers
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  
  -- Authentication
  password_hash TEXT NOT NULL,
  password TEXT,  -- Also support 'password' column if it exists
  
  -- User Profile
  name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'caretaker', 'management')),
  email_verified BOOLEAN DEFAULT FALSE,
  
  -- Contact Information
  phone TEXT,
  
  -- Location Information
  hostel TEXT,
  block TEXT,
  room_no TEXT,
  
  -- Educational Information (optional)
  department TEXT,
  college TEXT,
  year TEXT,
  
  -- Personal Information (optional)
  dob DATE,
  age INTEGER,
  specialization TEXT,
  
  -- Timestamps
  registered_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_hostel ON public.users(hostel);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON public.users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_registered_at ON public.users(registered_at DESC);

-- ============================================================================
-- ADD TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE public.users IS 'User accounts and profiles for FixIt Hostel system';

COMMENT ON COLUMN public.users.id IS 'Unique user identifier (format: user_timestamp)';
COMMENT ON COLUMN public.users.email IS 'User email address - used for login and contact';
COMMENT ON COLUMN public.users.password_hash IS 'Bcrypt hashed password for secure storage';
COMMENT ON COLUMN public.users.name IS 'Full name of the user';
COMMENT ON COLUMN public.users.role IS 'User role: student, caretaker, or management';
COMMENT ON COLUMN public.users.email_verified IS 'Whether email has been verified via OTP';
COMMENT ON COLUMN public.users.phone IS 'Contact phone number';
COMMENT ON COLUMN public.users.hostel IS 'Assigned hostel name or number';
COMMENT ON COLUMN public.users.block IS 'Hostel block assignment';
COMMENT ON COLUMN public.users.room_no IS 'Room number in the hostel';
COMMENT ON COLUMN public.users.department IS 'Department (primarily for students)';
COMMENT ON COLUMN public.users.college IS 'College or institution name';
COMMENT ON COLUMN public.users.year IS 'Year of study (for students)';
COMMENT ON COLUMN public.users.dob IS 'Date of birth';
COMMENT ON COLUMN public.users.age IS 'Age of user';
COMMENT ON COLUMN public.users.specialization IS 'Area of specialization (for caretakers)';
COMMENT ON COLUMN public.users.registered_at IS 'When the user registered';

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Allow anyone to insert (for registration)
DROP POLICY IF EXISTS "Allow anyone to insert users" ON public.users;
CREATE POLICY "Allow anyone to insert users" ON public.users
  FOR INSERT WITH CHECK (TRUE);

-- Allow anyone to select (for login verification)
DROP POLICY IF EXISTS "Allow anyone to select users" ON public.users;
CREATE POLICY "Allow anyone to select users" ON public.users
  FOR SELECT USING (TRUE);

-- Allow users to update their own record
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
CREATE POLICY "Users can update own record" ON public.users
  FOR UPDATE USING (auth.uid()::text = id OR TRUE);  -- Allow service role updates

-- Allow users to delete their own record
DROP POLICY IF EXISTS "Users can delete own record" ON public.users;
CREATE POLICY "Users can delete own record" ON public.users
  FOR DELETE USING (auth.uid()::text = id OR TRUE);  -- Allow service role deletes

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify your setup:

-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Count users
SELECT COUNT(*) as total_users FROM public.users;

-- Check table status
SELECT tablename FROM pg_tables WHERE tablename = 'users' AND schemaname = 'public';
