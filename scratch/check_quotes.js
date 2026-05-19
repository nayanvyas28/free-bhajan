const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wsjyrvaygneejcaovglc.supabase.co';
const supabaseAnonKey = 'sb_publishable_sq86edipSsedPGQ31t5TzA_WjB7rPQM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkQuotes() {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching quotes:', error.message);
  } else {
    console.log('Quotes found:', data.length);
    if (data.length > 0) {
      console.log('Latest quote:', data[0]);
    }
  }
}

checkQuotes();
