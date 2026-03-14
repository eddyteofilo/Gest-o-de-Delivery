
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrdersTable() {
  console.log('Checking orders table structure...');
  const { data, error } = await supabase.from('orders').select('*').limit(1);
  if (error) {
    console.error('Error selecting from orders:', error.message);
  } else {
    console.log('Sample order record keys:', data.length > 0 ? Object.keys(data[0]) : 'No records found');
  }
}

checkOrdersTable();
