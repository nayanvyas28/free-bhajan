import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const BASE_FAVORITES_KEY = '@bhajan_favorites';

// Helper to get dynamic key based on user
const getFavoritesKey = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || 'guest';
  return `${BASE_FAVORITES_KEY}_${userId}`;
};

// Helper to get current user session
const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
};

export const saveFavorite = async (video) => {
  try {
    const user = await getCurrentUser();
    const key = await getFavoritesKey();
    const videoId = video.id?.videoId || video.id;

    if (user) {
      const { error } = await supabase
        .from('user_favorites')
        .upsert({ 
          user_id: user.id, 
          video_id: videoId, 
          video_data: video 
        });
      if (error) throw error;
    }

    const existing = await AsyncStorage.getItem(key);
    const favs = existing ? JSON.parse(existing) : [];
    if (!favs.find(f => (f.id?.videoId || f.id) === videoId)) {
      favs.push(video);
      await AsyncStorage.setItem(key, JSON.stringify(favs));
    }
  } catch (error) {
    console.error('Error saving favorite:', error);
  }
};

export const removeFavorite = async (videoId) => {
  try {
    const user = await getCurrentUser();
    const key = await getFavoritesKey();

    if (user) {
      await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', videoId);
    }

    const existing = await AsyncStorage.getItem(key);
    if (existing) {
      const favs = JSON.parse(existing);
      const updatedFavs = favs.filter(f => (f.id?.videoId || f.id) !== videoId);
      await AsyncStorage.setItem(key, JSON.stringify(updatedFavs));
    }
  } catch (error) {
    console.error('Error removing favorite:', error);
  }
};

export const getFavorites = async () => {
  try {
    const user = await getCurrentUser();
    const key = await getFavoritesKey();

    if (user) {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('video_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        const remoteFavs = data.map(item => item.video_data);
        await AsyncStorage.setItem(key, JSON.stringify(remoteFavs));
        return remoteFavs;
      }
    }

    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting favorites:', error);
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
