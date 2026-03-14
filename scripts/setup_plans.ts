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
    { 
      name: 'Essencial', 
      price: 0, 
      max_products: 20, 
      features: { 
        marketing_tags: false, 
        custom_colors: false, 
        online_payment: false, 
        ai_assistant: false, 
        promotions: false, 
        couriers_management: false,
        advanced_reports: false,
        custom_domain: false,
        multi_user: false
      } 
    },
    { 
      name: 'Profissional', 
      price: 49.90, 
      max_products: 100, 
      features: { 
        marketing_tags: true, 
        custom_colors: true, 
        online_payment: true, 
        ai_assistant: false, 
        promotions: true, 
        couriers_management: false,
        advanced_reports: true,
        custom_domain: false,
        multi_user: false
      } 
    },
    { 
      name: 'Premium', 
      price: 99.90, 
      max_products: 0, 
      features: { 
        marketing_tags: true, 
        custom_colors: true, 
        online_payment: true, 
        ai_assistant: true, 
        promotions: true, 
        couriers_management: true,
        advanced_reports: true,
        custom_domain: true,
        multi_user: true
      } 
    }
  ];

  for (const plan of defaultPlans) {
    const { data: existing } = await supabase.from('plans').select('id, name').or(`name.eq.${plan.name},name.eq.Básico`).limit(1).single();
    if (existing) {
      console.log(`Updating plan: ${plan.name}`);
      await supabase.from('plans').update(plan).eq('id', existing.id);
    } else {
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
