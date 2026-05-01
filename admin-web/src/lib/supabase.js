import { createClient } from '@supabase/supabase-js';

// Replace these with your project's credentials
const supabaseUrl = 'https://wsjyrvaygneejcaovglc.supabase.co';
const supabaseAnonKey = 'sb_publishable_sq86edipSsedPGQ31t5TzA_WjB7rPQM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
