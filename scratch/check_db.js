import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wsjyrvaygneejcaovglc.supabase.co';
const supabaseAnonKey = 'sb_publishable_sq86edipSsedPGQ31t5TzA_WjB7rPQM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  console.log('--- Testing Category Insert from Script ---');
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name: 'Test Script Category', type: 'deity' }])
    .select();
  
  if (error) {
    console.log('Insert Error:', error.message);
  } else {
    console.log('Insert Success! Data:', data);
  }

  const { data: allData } = await supabase.from('categories').select('*');
  console.log('Total now:', allData?.length);
}

testInsert();
