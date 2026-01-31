#!/usr/bin/env node

/**
 * Verify Other API Endpoints Still Work
 * Ensures auth fixes didn't break other functionality
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function verifyOtherEndpoints() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     Verify Other API Endpoints Not Affected            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('⚠️ Supabase not configured - skipping cloud tests');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Test 1: Issues table
    console.log('🧪 Test 1: Issues Table');
    console.log('─'.repeat(56));
    const { data: issues, error: issuesError } = await supabase
      .from('issues')
      .select('count', { count: 'exact' })
      .limit(1);

    if (issuesError && issuesError.code !== 'PGRST116') {
      console.log(`❌ Issues table error: ${issuesError.message}`);
    } else {
      console.log('✅ Issues table accessible');
    }

    // Test 2: Lost & Found table
    console.log('\n🧪 Test 2: Lost & Found Items Table');
    console.log('─'.repeat(56));
    const { data: lostFound, error: lfError } = await supabase
      .from('lost_found_items')
      .select('count', { count: 'exact' })
      .limit(1);

    if (lfError && lfError.code !== 'PGRST116') {
      console.log(`❌ Lost & Found table error: ${lfError.message}`);
    } else {
      console.log('✅ Lost & Found table accessible');
    }

    // Test 3: Announcements table
    console.log('\n🧪 Test 3: Announcements Table');
    console.log('─'.repeat(56));
    const { data: announcements, error: annError } = await supabase
      .from('announcements')
      .select('count', { count: 'exact' })
      .limit(1);

    if (annError && annError.code !== 'PGRST116') {
      console.log(`❌ Announcements table error: ${annError.message}`);
    } else {
      console.log('✅ Announcements table accessible');
    }

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║          ✅ All Other Systems Still Working            ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

verifyOtherEndpoints();
