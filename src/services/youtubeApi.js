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
    let query = supabase.from('bhajans').select('*').or('is_visible.is.null,is_visible.eq.true').order('created_at', { ascending: false });
    
    if (category) query = query.ilike('category', category);
    if (type) query = query.ilike('type', type);
    if (subType) query = query.ilike('sub_type', subType);

    const { data, error } = await query;
    if (error) {
      console.error('Supabase Query Error:', error);
      return []; // Return empty so search fallback can trigger
    }

    if (!data || data.length === 0) return [];

    return data.map(item => {
      const rawUrl = item.url ? item.url.trim() : '';
      let vId = rawUrl;
      
      // Better YouTube ID extraction
      if ((item.type === 'youtube' || !item.type) && rawUrl.includes('http')) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = rawUrl.match(regExp);
        vId = (match && match[2].length === 11) ? match[2] : rawUrl;
      }

      const displayThumb = item.thumbnail || item.image_url || (vId.length === 11 ? `https://img.youtube.com/vi/${vId}/hqdefault.jpg` : null);

      return {
        id: { videoId: (item.type === 'youtube' || !item.type) ? (vId.length === 11 ? vId : rawUrl) : item.id?.toString() },
        audioUrl: (item.type === 'audio' || item.type === 'video') ? rawUrl : null,
        url: rawUrl,
        type: item.type || (rawUrl.includes('youtube.com') || rawUrl.includes('youtu.be') ? 'youtube' : 'video'),
        thumbnail: displayThumb,
        title: item.title,
        description: item.description,
        lyrics: item.lyrics || item.content || item.description,
        duration: item.duration || 0,
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
    const { data, error } = await supabase.from('categories').select('*').or('is_visible.is.null,is_visible.eq.true').order('name');
    if (error) {
      console.error('Categories Error:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    return [];
  }
};

export const getSolutions = async (category = null, type = null) => {
  try {
    let query = supabase.from('solutions').select('*').or('is_visible.is.null,is_visible.eq.true').order('created_at', { ascending: false });
    if (category) query = query.ilike('category', category);
    if (type) query = query.ilike('type', type);
    const { data, error } = await query;
    if (error) throw error;
    
    // Add solution flag for easier filtering in favorites
    const processedData = (data || []).map(item => ({
      ...item,
      is_solution: true
    }));
    
    return processedData;
  } catch (error) {
    console.error('Solutions Error:', error);
    return [];
  }
};

export const getDailyQuote = async () => {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    if (!data || data.length === 0) return null;

    // 1. Specific Override: If Admin added a new quote TODAY, show it!
    const newestQuote = data[0];
    const quoteDate = new Date(newestQuote.created_at);
    const today = new Date();
    
    const isToday = quoteDate.getDate() === today.getDate() &&
                    quoteDate.getMonth() === today.getMonth() &&
                    quoteDate.getFullYear() === today.getFullYear();
    
    if (isToday) {
      return newestQuote;
    }

    // 2. Auto Run: Rotate through all active quotes in the DB based on the day of the year
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = (today - start) + ((start.getTimezoneOffset() - today.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    return data[dayOfYear % data.length];
  } catch (error) {
    console.error('Daily Quote Error:', error);
    return null;
  }
};

export const getKathas = async () => {
  try {
    const { data, error } = await supabase
      .from('kathas')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(item => {
      const rawUrl = item.url || '';
      let vId = rawUrl;
      if (rawUrl.includes('http')) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = rawUrl.match(regExp);
        vId = (match && match[2].length === 11) ? match[2] : rawUrl;
      }

      const isYt = vId.length === 11;

      return {
        ...item,
        id: { videoId: vId },
        db_id: item.id,
        url: rawUrl,
        type: isYt ? 'youtube' : 'video',
        is_katha: true,
        subType: 'Katha',
        thumbnail: item.image_url,
        duration: item.duration || 0,
        snippet: {
          title: item.title,
          description: item.content || item.description,
          thumbnails: { 
            default: { url: item.image_url },
            medium: { url: item.image_url },
            high: { url: item.image_url } 
          },
          channelTitle: 'Katha'
        }
      };
    });
  } catch (error) {
    console.error('Kathas Fetch Error:', error);
    return [];
  }
};

export const getBanners = async () => {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('position', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Banners Fetch Error:', error);
    return [];
  }
};

export const getCalendarEvents = async () => {
  try {
    const { data, error } = await supabase
      .from('festivals')
      .select('*, kathas(*)')
      .order('event_date', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Calendar Fetch Error:', error);
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
      .not('is_visible', 'eq', false)
      .or(orCondition)
      .limit(15);

    let formattedDbResults = [];
    if (!dbError && dbBhajans) {
      formattedDbResults = dbBhajans.map(item => {
        const rawUrl = item.url ? item.url.trim() : '';
        let vId = rawUrl;
        
        if ((item.type === 'youtube' || !item.type) && rawUrl.includes('http')) {
          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
          const match = rawUrl.match(regExp);
          vId = (match && match[2].length === 11) ? match[2] : rawUrl;
        }

        const displayThumb = item.thumbnail || item.image_url || (vId.length === 11 ? `https://img.youtube.com/vi/${vId}/hqdefault.jpg` : null);

        const isSolution = item.category?.toLowerCase().includes('solution') || 
                          item.category?.toLowerCase().includes('upay') ||
                          item.sub_type?.toLowerCase().includes('solution');

        return {
          id: { videoId: (item.type === 'youtube' || !item.type) ? (vId.length === 11 ? vId : rawUrl) : item.id?.toString() },
          audioUrl: (item.type === 'audio' || item.type === 'video') ? rawUrl : null,
          url: rawUrl,
          type: item.type || (rawUrl.includes('youtube.com') || rawUrl.includes('youtu.be') ? 'youtube' : 'video'),
          image_url: displayThumb,
          title: item.title,
          description: item.description,
          category: item.category,
          subType: item.sub_type || 'Bhajan',
          is_solution: isSolution,
          snippet: {
            title: item.title,
            description: item.description,
            thumbnails: { high: { url: displayThumb } },
            channelTitle: item.category || 'Bhajan'
          }
        };
      });
    }
    // 2. Search in Kathas Table
    const lowQuery = query.toLowerCase().trim();
    const { data: dbKathas, error: kathaError } = await supabase
      .from('kathas')
      .select('*')
      .or(`title.ilike.%${lowQuery}%,content.ilike.%${lowQuery}%`)
      .limit(10);

    let formattedKathaResults = [];
    if (!kathaError && dbKathas) {
      formattedKathaResults = dbKathas.map(item => {
        const rawUrl = item.url || '';
        let vId = rawUrl;
        if (rawUrl.includes('http')) {
          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
          const match = rawUrl.match(regExp);
          vId = (match && match[2].length === 11) ? match[2] : rawUrl;
        }
        const displayThumb = item.image_url || (vId.length === 11 ? `https://img.youtube.com/vi/${vId}/hqdefault.jpg` : null);
        return {
          ...item,
          id: { videoId: vId },
          url: rawUrl,
          is_katha: true,
          subType: 'Katha',
          thumbnail: displayThumb,
          snippet: {
            title: item.title,
            description: item.content || item.description,
            thumbnails: { high: { url: displayThumb } },
            channelTitle: 'Katha'
          }
        };
      });
    }

    const allDbResults = [...formattedDbResults, ...formattedKathaResults];

    // 3. Search in YouTube API as fallback/extension
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
    } else if (allDbResults.length === 0) {
      ytResults = MOCK_BHAJANS.filter(b => 
        b.snippet.title.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Combine results: Database first, then YouTube
    // Filter duplicates by VideoId
    const combined = [...allDbResults, ...ytResults];
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

export const getBhajanById = async (id) => {
  try {
    if (!id) return null;
    console.log('Fetching Bhajan by ID:', id);
    
    const isNumeric = /^\d+$/.test(id);
    let query = supabase.from('bhajans').select('*');
    if (isNumeric) {
      query = query.eq('id', parseInt(id));
    } else {
      query = query.or(`id.eq.${id},url.ilike.%${id}%`);
    }
    
    const { data: bhajan, error } = await query.maybeSingle();
    if (!error && bhajan) {
      const item = bhajan;
      const rawUrl = item.url ? item.url.trim() : '';
      let vId = rawUrl;
      if ((item.type === 'youtube' || !item.type) && rawUrl.includes('http')) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = rawUrl.match(regExp);
        vId = (match && match[2].length === 11) ? match[2] : rawUrl;
      }
      const displayThumb = item.thumbnail || item.image_url || (vId.length === 11 ? `https://img.youtube.com/vi/${vId}/hqdefault.jpg` : null);
      return {
        id: { videoId: (item.type === 'youtube' || !item.type) ? (vId.length === 11 ? vId : rawUrl) : item.id?.toString() },
        audioUrl: (item.type === 'audio' || item.type === 'video') ? rawUrl : null,
        url: rawUrl,
        type: item.type || (rawUrl.includes('youtube.com') || rawUrl.includes('youtu.be') ? 'youtube' : 'video'),
        thumbnail: displayThumb,
        title: item.title,
        description: item.description,
        lyrics: item.lyrics || item.content || item.description,
        duration: item.duration || 0,
        subType: item.sub_type || 'Bhajan',
        snippet: {
          title: item.title,
          description: item.description,
          thumbnails: { high: { url: displayThumb } },
          channelTitle: item.category || 'Bhajan'
        }
      };
    }

    let kathaQuery = supabase.from('kathas').select('*');
    if (isNumeric) {
      kathaQuery = kathaQuery.eq('id', parseInt(id));
    } else {
      kathaQuery = kathaQuery.or(`id.eq.${id},url.ilike.%${id}%`);
    }
    const { data: katha, error: kathaErr } = await kathaQuery.maybeSingle();
    if (!kathaErr && katha) {
      const item = katha;
      const rawUrl = item.url || '';
      let vId = rawUrl;
      if (rawUrl.includes('http')) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = rawUrl.match(regExp);
        vId = (match && match[2].length === 11) ? match[2] : rawUrl;
      }
      const displayThumb = item.image_url || (vId.length === 11 ? `https://img.youtube.com/vi/${vId}/hqdefault.jpg` : null);
      return {
        ...item,
        id: { videoId: vId },
        db_id: item.id,
        url: rawUrl,
        type: vId.length === 11 ? 'youtube' : 'video',
        is_katha: true,
        subType: 'Katha',
        thumbnail: displayThumb,
        duration: item.duration || 0,
        snippet: {
          title: item.title,
          description: item.content || item.description,
          thumbnails: { high: { url: displayThumb } },
          channelTitle: 'Katha'
        }
      };
    }
    
    if (id.length === 11) {
      return {
        id: { videoId: id },
        type: 'youtube',
        thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        title: 'Shared Divine Content',
        description: 'MantraPuja Bhajans',
        snippet: {
          title: 'Shared Divine Content',
          description: 'MantraPuja Bhajans',
          thumbnails: { high: { url: `https://img.youtube.com/vi/${id}/hqdefault.jpg` } },
          channelTitle: 'Bhajan'
        }
      };
    }
  } catch (err) {
    console.error('getBhajanById error:', err);
  }
  return null;
};
