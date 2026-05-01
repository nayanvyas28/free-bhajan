import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const FAVORITES_KEY = '@bhajan_favorites';

// Helper to get current user session
const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
};

export const saveFavorite = async (video) => {
  try {
    const user = await getCurrentUser();
    const videoId = video.id.videoId;

    if (user) {
      // Save to Supabase
      const { error } = await supabase
        .from('user_favorites')
        .upsert({ 
          user_id: user.id, 
          video_id: videoId, 
          video_data: video 
        });
      if (error) throw error;
    }

    // Always keep a local copy for speed/offline
    const existing = await AsyncStorage.getItem(FAVORITES_KEY);
    const favs = existing ? JSON.parse(existing) : [];
    if (!favs.find(f => f.id.videoId === videoId)) {
      favs.push(video);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    }
  } catch (error) {
    console.error('Error saving favorite:', error);
  }
};

export const removeFavorite = async (videoId) => {
  try {
    const user = await getCurrentUser();

    if (user) {
      // Remove from Supabase
      await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', videoId);
    }

    // Remove from Local
    const existing = await AsyncStorage.getItem(FAVORITES_KEY);
    if (existing) {
      const favs = JSON.parse(existing);
      const updatedFavs = favs.filter(f => f.id.videoId !== videoId);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavs));
    }
  } catch (error) {
    console.error('Error removing favorite:', error);
  }
};

export const getFavorites = async () => {
  try {
    const user = await getCurrentUser();

    if (user) {
      // Fetch from Supabase
      const { data, error } = await supabase
        .from('user_favorites')
        .select('video_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        const remoteFavs = data.map(item => item.video_data);
        // Sync to local
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(remoteFavs));
        return remoteFavs;
      }
    }

    // Fallback to local
    const data = await AsyncStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

export const isFavorite = async (videoId) => {
  try {
    const favs = await getFavorites();
    return favs.some(f => f.id.videoId === videoId);
  } catch (error) {
    return false;
  }
};
