import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log('--- Table Check ---');
  // Check plans columns
  const { data: plans, error: pError } = await supabase.from('plans').select('*').limit(1);
  if (pError) {
    console.error('Plans error:', pError.message);
  } else {
    console.log('Plans record:', JSON.stringify(plans[0], null, 2));
  }

  // Check restaurants columns
  const { data: res, error: rError } = await supabase.from('restaurants').select('*').limit(1);
  if (rError) {
    console.error('Restaurants error:', rError.message);
  } else {
    console.log('Restaurants record:', JSON.stringify(res[0], null, 2));
  }
}

checkColumns();
