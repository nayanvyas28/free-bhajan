import axios from 'axios';

const BHASH_USER = 'MisCRM';
const BHASH_PASS = '123456'; 
const BHASH_SENDER = 'MisCRM';
const BASE_URL = 'https://bhashsms.com/api/sendmsg.php';

const normalizePhone = (phone) => {
  if (!phone) return '';
  let cleaned = phone.replace(/[^\d]/g, '');
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
};

export const sendWhatsAppOtp = async (phone, otp) => {
  const cleanPhone = normalizePhone(phone);
  const template = 'service_rejected_hindi';
  
  const httpsUrl = `https://bhashsms.com/api/sendmsg.php?user=${BHASH_USER}&pass=${BHASH_PASS}&sender=${BHASH_SENDER}&phone=${cleanPhone}&text=${template}&priority=wa&stype=normal&Params=${otp},OTP`;
  const httpUrl = `http://bhashsms.com/api/sendmsg.php?user=${BHASH_USER}&pass=${BHASH_PASS}&sender=${BHASH_SENDER}&phone=${cleanPhone}&text=${template}&priority=wa&stype=normal&Params=${otp},OTP`;

  console.log('[OTP] Sending via WhatsApp...');

  try {
    // Attempt HTTPS first
    try {
      console.log('[OTP] Trying HTTPS...');
      const response = await axios.get(httpsUrl, { 
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      console.log('[OTP] HTTPS Response:', response.data);
      if (response.data && !response.data.includes('ERR')) return response.data;
    } catch (e) {
      console.log('[OTP] HTTPS failed, falling back to HTTP:', e.message);
    }

    // Fallback to HTTP (Axios)
    try {
      console.log('[OTP] Trying HTTP (Axios)...');
      const response = await axios.get(httpUrl, {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      console.log('[OTP] HTTP Axios Response:', response.data);
      if (response.data && !response.data.includes('ERR')) return response.data;
    } catch (e) {
      console.log('[OTP] HTTP Axios failed:', e.message);
    }

    // Final Fallback: Native Fetch
    console.log('[OTP] Trying Native Fetch...');
    const fetchResponse = await fetch(httpUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const result = await fetchResponse.text();
    console.log('[OTP] Native Fetch Response:', result);
    
    if (result && result.includes('ERR')) {
      throw new Error(`API Error: ${result}`);
    }
    
    return result;
  } catch (error) {
    console.error('[OTP] Production Dispatch Error:', error.message);
    throw new Error('Failed to send WhatsApp OTP. Please use the debug code 123456 or try again.');
  }
};
