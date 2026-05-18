const USER_ID = '652498';
const API_KEY = 'ak-79384389cfe8abe2b1cdeb45912f9c6255490c70';
const BASE_URL = 'https://json.astrologyapi.com/v1';

const getAuthHeader = () => {
  // Simple base64 encoder for React Native
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  const str = `${USER_ID}:${API_KEY}`;
  let out = '';
  for (let i = 0, b64; i < str.length; ) {
    b64 = str.charCodeAt(i++) << 16 | str.charCodeAt(i++) << 8 | str.charCodeAt(i++);
    out += chars.charAt(b64 >> 18 & 63) + chars.charAt(b64 >> 12 & 63) + chars.charAt(b64 >> 6 & 63) + chars.charAt(b64 & 63);
  }
  // Note: This is a simple version, for production use a robust polyfill if needed
  // But for this simple key, it works.
  
  // Since we are in React Native, we can also try to use global.btoa if it exists (some polyfills add it)
  const auth = (typeof btoa !== 'undefined') ? btoa(str) : out;
  
  return {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json'
  };
};

export const getPanchangForDate = async (date = new Date(), lang = 'en') => {
  try {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    console.log(`Fetching Panchang for: ${day}-${month}-${year} (${lang})`);

    // AstrologyAPI uses 'hi' for Hindi
    const apiLang = lang === 'hi' ? 'hi' : 'en';

    const data = {
      day,
      month,
      year,
      hour: 6, // Set to sunrise time for more accurate Panchang
      min: 0,
      lat: 28.6139,
      lon: 77.2090,
      tzone: 5.5
    };

    const response = await fetch(`${BASE_URL}/advanced_panchang`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Accept-Language': apiLang // Some APIs use headers for language
      },
      body: JSON.stringify({ ...data, language: apiLang }) // Others use body
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const result = await response.json();
    console.log('Panchang API Raw Result:', JSON.stringify(result, null, 2));
    
    // Very robust extraction logic for varied API responses
    const tithiData = result.tithi || {};
    const nakshatraData = result.nakshatra || {};
    const karanaData = result.karana || {};
    const muhuratData = result.abhijit_muhurta || {};
    const rahuData = result.rahu_kaal || result.rahukaal || {};

    const formatTime = (timeData) => {
      if (typeof timeData === 'string') return timeData;
      if (timeData && timeData.start && timeData.end) return `${timeData.start} - ${timeData.end}`;
      return 'N/A';
    };

    return {
      tithi: tithiData.details?.tithi_name || tithiData.name || result.tithi_name || null,
      paksha: result.paksha || tithiData.details?.paksha || tithiData.paksha || 
              (tithiData.name ? tithiData.name.split(/[\s-]+/)[0] : null),
      nakshatra: nakshatraData.details?.nak_name || nakshatraData.name || 
                 (typeof result.nakshatra === 'string' ? result.nakshatra : null) || 
                 result.nakshatra_name || result.star || null,
      karana: karanaData.details?.karana_name || karanaData.name || result.karana_name || null,
      muhurat: formatTime(muhuratData) === 'N/A' ? null : formatTime(muhuratData),
      rahukaal: formatTime(rahuData) === 'N/A' ? null : formatTime(rahuData),
      sunrise: result.sunrise || result.vedic_sunrise || null,
      sunset: result.sunset || result.vedic_sunset || null
    };
  } catch (error) {
    console.error('Panchang API Error:', error);
    return null;
  }
};
