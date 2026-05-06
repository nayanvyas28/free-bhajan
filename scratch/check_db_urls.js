const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://shiyzhonmghbphcsqmju.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoaXl6aG9ubWdoYnBoY3NxbWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU0MTI0NjIsImV4cCI6MjAzMTAxNjQ2Mn0.z5i6_z-X_v_W-n1-v_W-n1-v_W-n1-v_W-n1-v_W-n1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUrls() {
  console.log('--- Checking Recent Solutions ---');
  const { data: solutions } = await supabase.from('solutions').select('title, url, type').order('created_at', { ascending: false }).limit(3);
  solutions?.forEach(s => console.log(`Title: ${s.title} | Type: ${s.type} | URL: ${s.url}`));

  console.log('\n--- Checking Recent Bhajans ---');
  const { data: bhajans } = await supabase.from('bhajans').select('title, url, type').order('created_at', { ascending: false }).limit(3);
  bhajans?.forEach(b => console.log(`Title: ${b.title} | Type: ${b.type} | URL: ${b.url}`));
}

checkUrls();
