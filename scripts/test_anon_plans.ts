import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testPlans() {
  console.log('Testing access with ANON key...');
  const { data, error } = await supabase.from('plans').select('*');
  if (error) {
    console.error('Error fetching plans:', error);
  } else {
    console.log('Plans fetched successfully with ANON key:', data.length);
    console.log('Plans:', data);
  }
}

testPlans();
