import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listPlans() {
  const { data, error } = await supabase.from('plans').select('*').order('price', { ascending: true });
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('--- ALL PLANS ---');
    console.log(JSON.stringify(data, null, 2));
  }
}

listPlans();
