import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: plans, error: plansError } = await supabase.from('plans').select('*');
  console.log('Plans:', plans);
  if (plansError) console.error('Plans Error:', plansError);

  const { data: restaurants, error: restError } = await supabase.from('restaurants').select('id, name, plan_id').limit(5);
  console.log('Restaurants:', restaurants);
  if (restError) console.error('Restaurants Error:', restError);
}

check();
