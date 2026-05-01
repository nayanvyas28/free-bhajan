import axios from 'axios';
import { supabase } from '../storage/supabase';

const API_KEY = 'YOUR_YOUTUBE_API_KEY';
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Ultimate Fallback Data to ensure app is NEVER empty
const MOCK_BHAJANS = [
  {
    id: { videoId: 'm4n9-K-pYvU' },
    snippet: {
      title: 'Shyam Hai Na ❤️ सब ठीक है ना | Khatu Shyam Bhajan',
      description: 'MantraPuja Bhajans',
      thumbnails: { high: { url: 'https://img.youtube.com/vi/m4n9-K-pYvU/maxresdefault.jpg' } },
      channelTitle: 'MantraPuja'
    }
  },
  {
    id: { videoId: '8p8_6v_nZas' },
    snippet: {
      title: 'Mere Banke Bihari Lal | Lord Krishna Bhajan',
      description: 'Devotional Krishna Bhajan',
      thumbnails: { high: { url: 'https://img.youtube.com/vi/8p8_6v_nZas/maxresdefault.jpg' } },
      channelTitle: 'Bhakti Sagar'
    }
  }
];

// Fetch from curated SQL Database
export const getCuratedBhajans = async (category = null, type = null, subType = null) => {
  try {
    console.log('Fetching Curated:', { category, type, subType });
    let query = supabase.from('bhajans').select('*').order('created_at', { ascending: false });
    
    if (category) query = query.eq('category', category);
    if (type) query = query.eq('type', type);
    if (subType) query = query.eq('sub_type', subType);

    const { data, error } = await query;
    if (error) {
      console.error('Supabase Query Error:', error);
      return []; // Return empty so search fallback can trigger
    }

    if (!data || data.length === 0) return [];

    return data.map(item => {
      let vId = item.url;
      if (item.type === 'youtube' && item.url?.includes('http')) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = item.url.match(regExp);
        vId = (match && match[2].length === 11) ? match[2] : item.url;
      }

      const displayThumb = item.thumbnail || item.image_url || `https://img.youtube.com/vi/${vId}/hqdefault.jpg`;

      return {
        id: { videoId: item.type === 'youtube' ? vId : item.id?.toString() },
        audioUrl: item.type === 'audio' ? item.url : null,
        type: item.type || 'youtube',
        thumbnail: displayThumb, // Add top level thumbnail
        title: item.title, // Add top level title
        subType: item.sub_type || 'Bhajan',
        snippet: {
          title: item.title,
          description: item.description,
          thumbnails: {
            default: { url: displayThumb },
            medium: { url: displayThumb },
            high: { url: displayThumb }
          },
          channelTitle: item.category || 'Bhajan'
        }
      };
    });
  } catch (error) {
    console.error('Curated Fetch Exception:', error);
    return [];
  }
};

export const getCategories = async () => {
  try {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) {
      console.error('Categories Error:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    return [];
  }
};

export const getSolutions = async (category = null) => {
  try {
    let query = supabase.from('solutions').select('*').order('created_at', { ascending: false });
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
};

let _apiKeyWarnShown = false;

export const searchBhajans = async (query = 'krishna bhajan', maxResults = 10) => {
  try {
    console.log('Searching YouTube:', query);
    if (API_KEY === 'YOUR_YOUTUBE_API_KEY') {
      if (!_apiKeyWarnShown) {
        console.log('YouTube API Key missing. Returning MOCK data.');
        _apiKeyWarnShown = true;
      }
      return MOCK_BHAJANS;
    }
    const response = await axios.get(`${BASE_URL}/search`, {
      params: {
        part: 'snippet',
        maxResults: maxResults,
        q: query,
        type: 'video',
        key: API_KEY,
      },
    });
    return response.data.items || [];
  } catch (error) {
    console.log('YouTube search error:', error.message);
    return [];
  }
};
