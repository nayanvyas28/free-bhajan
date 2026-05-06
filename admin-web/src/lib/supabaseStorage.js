import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Uploads a file to Supabase Storage bucket 'mpbucket'
 */
export const uploadToSupabase = async (file) => {
    try {
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const filePath = `${fileName}`;

        console.log(`[Supabase] Starting upload for ${file.name} to mpbucket...`);

        const { data, error } = await supabase.storage
            .from('mpbucket')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('mpbucket')
            .getPublicUrl(filePath);

        console.log(`[Supabase] Upload Success! Public URL: ${publicUrl}`);
        return publicUrl;
    } catch (error) {
        console.error("Supabase Storage Error:", error.message);
        throw error;
    }
};
