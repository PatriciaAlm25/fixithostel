import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load backend .env
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in backend/.env or root .env.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

try {
  const { data, error } = await supabase
    .from('lost_found_items')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Supabase error:', error);
    process.exit(2);
  }

  console.log('Found items:', (data && data.length) || 0);
  console.log(JSON.stringify(data, null, 2));
} catch (e) {
  console.error('Unexpected error:', e.message);
  process.exit(3);
}
