import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const BASE_FAVORITES_KEY = '@bhajan_favorites';

// Helper to get dynamic key based on user
const getFavoritesKey = async () => {
  const profileStr = await AsyncStorage.getItem('@user_profile');
  const userId = profileStr ? JSON.parse(profileStr).phone_number : 'guest';
  return `${BASE_FAVORITES_KEY}_${userId}`;
};

// Helper to get current user session
const getCurrentUser = async () => {
  const profileStr = await AsyncStorage.getItem('@user_profile');
  return profileStr ? JSON.parse(profileStr) : null;
};

export const saveFavorite = async (video) => {
  try {
    const user = await getCurrentUser();
    const key = await getFavoritesKey();
    const videoId = video.id?.videoId || video.id;

    console.log(`[FAV] Saving favorite: ${videoId}, Type: ${video.type}`);

    // 1. Save to AsyncStorage immediately for instant UI feedback
    const existing = await AsyncStorage.getItem(key);
    let favs = existing ? JSON.parse(existing) : [];
    if (!favs.find(f => (f.id?.videoId || f.id) === videoId)) {
      favs.unshift(video); // Add to top
      await AsyncStorage.setItem(key, JSON.stringify(favs));
      console.log(`[FAV] Saved to local storage. Total: ${favs.length}`);
    }

    // 2. Sync to Supabase if user has a valid UUID
    if (user && user.id && user.id.length > 20) {
      console.log(`[FAV] Syncing to Supabase for User: ${user.id}`);
      const { error } = await supabase
        .from('user_favorites')
        .upsert({ 
          user_id: user.id,
          video_id: String(videoId), 
          video_data: video 
        }, { onConflict: 'user_id, video_id' });
      
      if (error) {
        console.warn(`[FAV] Supabase sync failed: ${error.message}`);
      } else {
        console.log(`[FAV] Supabase sync successful`);
      }
    }
  } catch (error) {
    console.error('[FAV] Error saving favorite:', error);
  }
};

export const removeFavorite = async (videoId) => {
  try {
    const user = await getCurrentUser();
    const key = await getFavoritesKey();

    console.log(`[FAV] Removing favorite: ${videoId}`);

    // 1. Remove from AsyncStorage
    const existing = await AsyncStorage.getItem(key);
    if (existing) {
      const favs = JSON.parse(existing);
      const updatedFavs = favs.filter(f => (f.id?.videoId || f.id) !== videoId);
      await AsyncStorage.setItem(key, JSON.stringify(updatedFavs));
      console.log(`[FAV] Removed from local storage. Remaining: ${updatedFavs.length}`);
    }

    // 2. Remove from Supabase
    if (user && user.id && user.id.length > 20) {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', String(videoId));
      
      if (error) console.warn(`[FAV] Supabase delete failed: ${error.message}`);
    }
  } catch (error) {
    console.error('[FAV] Error removing favorite:', error);
  }
};

export const getFavorites = async () => {
  try {
    const user = await getCurrentUser();
    const key = await getFavoritesKey();
    
    // 1. Get Local Data
    const localData = await AsyncStorage.getItem(key);
    let localFavs = localData ? JSON.parse(localData) : [];
    
    let remoteFavs = [];
    if (user && user.id && user.id.length > 20) {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('video_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        remoteFavs = data.map(item => item.video_data);
      }
    }

    // 2. Merge Data (Local + Remote) - Local takes precedence for UI speed
    const mergedMap = new Map();
    // Add remote items first
    remoteFavs.forEach(f => {
      const id = f.id?.videoId || f.id;
      if (id) mergedMap.set(String(id), f);
    });
    // Overlay with local items (more recent)
    localFavs.forEach(f => {
      const id = f.id?.videoId || f.id;
      if (id) mergedMap.set(String(id), f);
    });

    let favs = Array.from(mergedMap.values());

    // 3. Integrity Check: Verifies curated items still exist in DB
    const curatedFavs = favs.filter(f => f && (f.type === 'video' || f.type === 'audio'));
    if (curatedFavs.length > 0) {
      try {
        const curatedIds = curatedFavs.map(f => f.id?.videoId || f.id).filter(id => id && id.length > 10);
        
        if (curatedIds.length > 0) {
          const { data: existingSolutions } = await supabase.from('solutions').select('id').in('id', curatedIds);
          const { data: existingBhajans } = await supabase.from('bhajans').select('id').in('id', curatedIds);
          
          const existingIds = new Set([
            ...(existingSolutions || []).map(s => String(s.id).toLowerCase()),
            ...(existingBhajans || []).map(b => String(b.id).toLowerCase())
          ]);

          // Only filter if we actually got results from DB (to avoid purging on network error)
          if (existingIds.size > 0 || (existingSolutions && existingBhajans)) {
            const filteredFavs = favs.filter(f => {
              if (f && (f.type === 'video' || f.type === 'audio')) {
                const vidId = String(f.id?.videoId || f.id).toLowerCase();
                const exists = existingIds.has(vidId);
                if (!exists) console.log(`[FAV] Integrity check: Removing stale ID ${vidId}`);
                return exists;
              }
              return true;
            });

            if (filteredFavs.length !== favs.length) {
              favs = filteredFavs;
              // Update local storage with cleaned list
              await AsyncStorage.setItem(key, JSON.stringify(favs));
            }
          }
        }
      } catch (e) {
        console.warn("[FAV] Integrity check error:", e.message);
      }
    }

    return favs;
  } catch (error) {
    console.error('[FAV] Error getting favorites:', error);
    return [];
  }
};

export const isFavorite = async (videoId) => {
  try {
    const favs = await getFavorites();
    return favs.some(f => (f.id?.videoId || f.id) === videoId);
  } catch (error) {
    return false;
  }
};
