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
  
  const url = `${BASE_URL}?user=${BHASH_USER}&pass=${BHASH_PASS}&sender=${BHASH_SENDER}&phone=${cleanPhone}&text=${template}&priority=wa&stype=normal&Params=${otp},OTP`;

  console.log('[OTP] Sending via WhatsApp. (HTTPS Attempt)');

  try {
    const response = await axios.get(url);
    console.log('[OTP] API Response:', response.data);
    
    if (response.data && response.data.includes('ERR')) {
      throw new Error(`API Error: ${response.data}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('[OTP] Production Dispatch Error:', error.message);
    // In production, we should probably still allow a fallback or show a clear error
    throw new Error('Failed to send WhatsApp OTP. Please check your internet or try again later.');
  }
};
