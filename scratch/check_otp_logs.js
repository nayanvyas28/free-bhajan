import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wsjyrvaygneejcaovglc.supabase.co';
const supabaseAnonKey = 'sb_publishable_sq86edipSsedPGQ31t5TzA_WjB7rPQM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLogs() {
  console.log('--- Fetching Latest OTP Logs ---');
  const { data, error } = await supabase
    .from('otp_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('Error fetching logs:', error.message);
  } else {
    console.log('Latest 10 logs:');
    console.log(JSON.stringify(data, null, 2));
  }
}

checkLogs();
