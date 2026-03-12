import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupPlans() {
  console.log('Ensuring default plans exist...');
  
  const defaultPlans = [
    { name: 'Básico', price: 0, max_products: 20, features: { marketing_tags: false, custom_colors: false } },
    { name: 'Profissional', price: 49.90, max_products: 100, features: { marketing_tags: true, custom_colors: true } },
    { name: 'Premium', price: 99.90, max_products: 1000, features: { marketing_tags: true, custom_colors: true, unlimited_products: true } }
  ];

  for (const plan of defaultPlans) {
    const { data: existing } = await supabase.from('plans').select('id').eq('name', plan.name).single();
    if (!existing) {
      console.log(`Inserting plan: ${plan.name}`);
      await supabase.from('plans').insert(plan);
    }
  }

  console.log('Ensuring all restaurants have a plan...');
  const { data: basicPlan } = await supabase.from('plans').select('id').eq('name', 'Básico').single();
  if (basicPlan) {
    const { error: updateError } = await supabase
      .from('restaurants')
      .update({ plan_id: basicPlan.id })
      .is('plan_id', null);
    
    if (updateError) console.error('Error updating restaurants:', updateError.message);
    else console.log('Updated restaurants with null plan_id to Basic Plan.');
  }

  const { data: finalPlans } = await supabase.from('plans').select('*');
  console.log('Final plans list:', finalPlans);
}

setupPlans();
