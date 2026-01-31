#!/usr/bin/env node

/**
 * Check Users Table Structure in Supabase
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableStructure() {
  console.log('\n🔍 Checking users table structure in Supabase...\n');

  try {
    // Get table structure via introspection
    let rows = null;
    try {
      const result = await supabase.rpc('get_table_columns', { table_name: 'users' });
      rows = result.data;
    } catch (e) {
      // RPC might not exist, that's ok
    }

    if (rows) {
      console.log('Columns found via RPC:');
      console.log(rows);
      return;
    }

    // Fallback: Try to get a single row to see what columns exist
    const { data, error: selectError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (selectError) {
      console.error('❌ Error:', selectError.message);
      console.error('Details:', selectError);
    }

    if (data && data.length > 0) {
      console.log('✅ Users table structure (based on first row):');
      const columns = Object.keys(data[0]);
      console.log(columns);
      console.log('\n📊 Total columns:', columns.length);
    } else {
      console.log('⚠️  No users in table yet. Using manual check...');
      
      // Try to manually check by attempting to insert and catch column errors
      console.log('\n Checking for specific columns by attempting operations:\n');
      
      const testColumns = [
        'id', 'email', 'password_hash', 'password', 'name', 'role', 
        'email_verified', 'phone', 'hostel', 'block', 'room_no',
        'department', 'college', 'year', 'dob', 'age',
        'registered_at', 'created_at', 'updated_at'
      ];

      for (const col of testColumns) {
        try {
          const { data: testData, error: testError } = await supabase
            .from('users')
            .select(col)
            .limit(1);

          if (testError) {
            if (testError.message.includes(`"${col}"`) || testError.message.includes(`'${col}'`)) {
              console.log(`❌ ${col} - NOT FOUND`);
            } else {
              console.log(`✅ ${col}`);
            }
          } else {
            console.log(`✅ ${col}`);
          }
        } catch (e) {
          // Silently fail
        }
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTableStructure().catch(console.error);
