import { createClient } from '@supabase/supabase-js';

// Credentials from the project context
const supabaseUrl = 'https://wsjyrvaygneejcaovglc.supabase.co';
const supabaseKey = 'sb_publishable_sq86edipSsedPGQ31t5TzA_WjB7rPQM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateBanners() {
  console.log("Updating temp banners...");
  
  const banners = [
    {
      position: 'top',
      image_url: 'https://images.unsplash.com/photo-1545062990-4a95e8e4b96d?auto=format&fit=crop&w=800&q=80', // Spiritual Lotus
      link_url: 'https://mantrapuja.com',
      is_visible: true
    },
    {
      position: 'bottom',
      image_url: 'https://images.unsplash.com/photo-1528702748617-c64d49f918af?auto=format&fit=crop&w=800&q=80', // Golden Temple/Spiritual
      link_url: 'https://mantrapuja.com',
      is_visible: true
    }
  ];

  for (const banner of banners) {
    // Delete existing for this position to avoid duplicates
    await supabase.from('banners').delete().eq('position', banner.position);
    
    // Insert new one
    const { error } = await supabase.from('banners').insert(banner);
    
    if (error) console.error(`Error updating ${banner.position}:`, error.message);
    else console.log(`${banner.position} updated!`);
  }
}

updateBanners();
