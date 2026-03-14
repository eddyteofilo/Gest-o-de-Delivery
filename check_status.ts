import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatus() {
  const { data: plans } = await supabase.from('plans').select('*');
  console.log('--- Current Plans ---');
  console.log(plans?.map(p => p.name).join(', '));
  
  const { data: restaurants } = await supabase.from('restaurants').select('name, role, plan_id').eq('role', 'superadmin');
  console.log('--- Super Admins in Restaurant table ---');
  console.log(restaurants);

  const { data: platformUsers } = await supabase.from('platform_users').select('name, role');
  console.log('--- Platform Users ---');
  console.log(platformUsers);
}

checkStatus();
