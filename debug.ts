import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
  console.log('--- Supabase Debug ---');
  try {
    const { data, error } = await supabase.from('plans').select('*').limit(1);
    if (error) {
      console.log('Error querying plans table:', error.message);
    } else {
      console.log('Successfully queried plans table. Row count:', data.length);
    }

    const { data: rData, error: rError } = await supabase.from('restaurants').select('plan_id').limit(1);
    if (rError) {
      console.log('Error querying restaurants.plan_id:', rError.message);
    } else {
      console.log('Successfully queried restaurants.plan_id');
    }

    const { data: pUsers, error: puError } = await supabase.from('platform_users').select('*').limit(1);
    if (puError) {
      console.log('Error querying platform_users table:', puError.message);
    } else {
      console.log('Successfully queried platform_users table');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

debug();
