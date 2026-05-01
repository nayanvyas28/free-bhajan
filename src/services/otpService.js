import axios from 'axios';

const BHASH_USER = 'MisCRM';
const BHASH_PASS = '123456'; 
const BHASH_SENDER = 'MisCRM';
const BASE_URL = 'http://bhashsms.com/api/sendmsg.php';

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
  
  // Constructing URL exactly as in the working mantrapujaAll project
  const url = `${BASE_URL}?user=${BHASH_USER}&pass=${BHASH_PASS}&sender=${BHASH_SENDER}&phone=${cleanPhone}&text=${template}&priority=wa&stype=normal&Params=${otp},OTP`;

  console.log('[OTP] Sending via WhatsApp. URL:', url.replace(BHASH_PASS, '******'));

  try {
    // 1. Try standard fetch (legacy APIs often like this better than axios)
    // We don't wait for the response to be 'ok' because these APIs often return 200 with error text
    const response = await fetch(url, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-cache',
    });
    
    // In React Native, fetch response might not have 'text()' if no-cors is used or headers are weird
    // So we just log the status
    console.log('[OTP] Fetch Status:', response.status);
    
    // 2. Proactive Fallback: Sometimes fetch is blocked by ISP/DNS, but image requests pass through
    // In React Native, we can't use 'new Image()', but we can pre-fetch or just rely on the first fetch
    
    return "OTP Dispatch Attempted";
  } catch (error) {
    console.error('[OTP] Fetch Error:', error.message);
    throw new Error('WhatsApp failed. Check console for OTP.');
  }
};
