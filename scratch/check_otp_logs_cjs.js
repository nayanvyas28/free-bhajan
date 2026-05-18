const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wsjyrvaygneejcaovglc.supabase.co';
const supabaseAnonKey = 'sb_publishable_sq86edipSsedPGQ31t5TzA_WjB7rPQM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSettings() {
  console.log('--- Fetching System Settings ---');
  const { data, error } = await supabase
    .from('system_settings')
    .select('*');
  
  if (error) {
    console.error('Error fetching system settings:', error.message);
  } else {
    console.log('System Settings:');
    console.log(JSON.stringify(data, null, 2));
  }
}

checkSettings();
