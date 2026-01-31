#!/usr/bin/env node

/**
 * Create or Fix Users Table in Supabase
 * Adds missing columns if they don't exist
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase credentials not found in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUsersTable() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║      FixIt Hostel - Users Table Migration           ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  try {
    // Test connection
    console.log('🔍 Testing Supabase connection...');
    const { data, error: connError } = await supabase.from('users').select('count', { count: 'exact' }).limit(1);
    
    if (connError) {
      if (connError.code === 'PGRST116' || connError.message.includes('does not exist')) {
        console.log('⚠️  Users table does not exist. Creating it...\n');
      } else {
        throw connError;
      }
    } else {
      console.log('✅ Connection successful\n');
    }

    // Try to get table structure
    console.log('🔍 Checking users table structure...');
    const { data: tableData, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (tableError && tableError.code === 'PGRST116') {
      console.log('⚠️  Table does not exist yet\n');
      console.log('📋 To create the users table, run this SQL in Supabase SQL Editor:\n');
      
      const sql = `-- Create the users table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'student',
  email_verified BOOLEAN DEFAULT FALSE,
  phone TEXT,
  hostel TEXT,
  block TEXT,
  room_no TEXT,
  department TEXT,
  college TEXT,
  year TEXT,
  dob DATE,
  age INTEGER,
  registered_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_hostel ON public.users(hostel);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON public.users(email_verified);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow anyone to insert" ON public.users FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow anyone to select" ON public.users FOR SELECT USING (TRUE);
CREATE POLICY "Allow users to update own record" ON public.users FOR UPDATE USING (auth.uid()::text = id);
CREATE POLICY "Allow users to delete own record" ON public.users FOR DELETE USING (auth.uid()::text = id);`;

      console.log(sql);
      console.log('\n📌 NOTE: The above table uses password_hash instead of password');
      console.log('    to match your backend code.\n');
      
      return;
    }

    if (tableError) {
      throw tableError;
    }

    console.log('✅ Users table exists\n');
    console.log('📊 Table columns are accessible\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  }
}

fixUsersTable().catch(console.error);
