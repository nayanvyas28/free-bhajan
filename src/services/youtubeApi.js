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

const SEARCH_MAP = {
  'shiv': ['shiv', 'shiva', 'mahadev', 'bholenath', 'शिव'],
  'shiva': ['shiv', 'shiva', 'mahadev', 'bholenath', 'शिव'],
  'krishna': ['krishna', 'kanha', 'shyam', 'krishn', 'कृष्ण'],
  'shyam': ['krishna', 'kanha', 'shyam', 'krishn', 'कृष्ण'],
  'ganesh': ['ganesh', 'ganesha', 'ganpati', 'vinayaka', 'गणे़श'],
  'ganesha': ['ganesh', 'ganesha', 'ganpati', 'vinayaka', 'गणे़श'],
  'hanuman': ['hanuman', 'bajrangbali', 'anjaneya', 'हनुमान'],
  'ram': ['ram', 'rama', 'ramayan', 'सियाराम', 'राम'],
  'laxmi': ['laxmi', 'lakshmi', 'mahalaxmi', 'लक्ष्मी'],
  'durga': ['durga', 'ma durga', 'shakti', 'दुर्गा'],
  'bhajan': ['bhajan', 'devotional', 'bhakti', 'भजन'],
  'mantra': ['mantra', 'jaap', 'chant', 'मंत्र'],
  // Hindi to English Mappings
  'शिव': ['shiv', 'shiva', 'mahadev'],
  'कृष्ण': ['krishna', 'kanha', 'shyam'],
  'राम': ['ram', 'rama'],
  'हनुमान': ['hanuman', 'bajrangbali'],
  'गणेश': ['ganesh', 'ganesha', 'ganpati'],
  'लक्ष्मी': ['laxmi', 'lakshmi'],
  'दुर्गा': ['durga'],
  'भजन': ['bhajan'],
  'मंत्र': ['mantra']
};

const expandQuery = (query) => {
  const lowQuery = query.toLowerCase().trim();
  let terms = [lowQuery];
  
  // Find synonyms from map
  for (const [key, synonyms] of Object.entries(SEARCH_MAP)) {
    if (key === lowQuery || synonyms.includes(lowQuery)) {
      terms = [...new Set([...terms, key, ...synonyms])];
      break;
    }
  }
  
  // Basic fuzzy handling (e.g., shiv -> shiva)
  if (lowQuery.length > 3) {
    if (lowQuery.endsWith('a')) terms.push(lowQuery.slice(0, -1));
    else terms.push(lowQuery + 'a');
  }

  return [...new Set(terms)];
};

export const searchBhajans = async (query = 'krishna bhajan', maxResults = 15) => {
  try {
    const searchTerms = expandQuery(query);
    console.log('Smart Search Terms:', searchTerms);
    
    // 1. Search in local Supabase Database
    // Build an OR query for all expanded terms
    const orCondition = searchTerms
      .map(term => `title.ilike.%${term}%,category.ilike.%${term}%`)
      .join(',');

    const { data: dbBhajans, error: dbError } = await supabase
      .from('bhajans')
      .select('*')
      .or(orCondition)
      .limit(15);

    let formattedDbResults = [];
    if (!dbError && dbBhajans) {
      formattedDbResults = dbBhajans.map(item => {
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
          image_url: displayThumb,
          title: item.title,
          snippet: {
            title: item.title,
            description: item.description,
            thumbnails: { high: { url: displayThumb } },
            channelTitle: item.category || 'Bhajan'
          }
        };
      });
    }

    // 2. Search in YouTube API as fallback/extension
    let ytResults = [];
    if (API_KEY !== 'YOUR_YOUTUBE_API_KEY') {
      try {
        const response = await axios.get(`${BASE_URL}/search`, {
          params: {
            part: 'snippet',
            maxResults: maxResults,
            q: query,
            type: 'video',
            key: API_KEY,
          },
        });
        ytResults = response.data.items || [];
      } catch (err) {
        console.log('YT API error:', err.message);
      }
    } else if (formattedDbResults.length === 0) {
      ytResults = MOCK_BHAJANS.filter(b => 
        b.snippet.title.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Combine results: Database first, then YouTube
    // Filter duplicates by VideoId
    const combined = [...formattedDbResults, ...ytResults];
    const seenIds = new Set();
    return combined.filter(item => {
      const id = item.id?.videoId || item.audioUrl;
      if (seenIds.has(id)) return false;
      seenIds.add(id);
      return true;
    });

  } catch (error) {
    console.log('Search exception:', error.message);
    return [];
  }
};
