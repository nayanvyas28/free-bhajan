import axios from 'axios';
import { supabase } from '../storage/supabase';

const BHASH_USER = 'MisCRM';
const BHASH_PASS = '123456'; 
const BHASH_SENDER = 'MisCRM';

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

// Custom Promise.any polyfill to race promises and return the first one that successfully resolves
const anySuccessfulPromise = (promises) => {
  return new Promise((resolve, reject) => {
    let completed = 0;
    const errors = [];
    promises.forEach((p) => {
      Promise.resolve(p)
        .then((val) => {
          resolve(val);
        })
        .catch((err) => {
          errors.push(err);
          completed++;
          if (completed === promises.length) {
            reject(new Error('All dispatch methods failed: ' + errors.map(e => e.message).join(', ')));
          }
        });
    });
  });
};

export const sendWhatsAppOtp = async (phone, otp) => {
  const cleanPhone = normalizePhone(phone);
  
  // 1. Fetch active template and credentials dynamically from Supabase system_settings
  let activeTemplate = 'service_rejected_hindi';
  let apiUser = BHASH_USER;
  let apiPass = BHASH_PASS;
  let apiSender = BHASH_SENDER;

  try {
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('key, value');
    
    if (settings && settings.length > 0) {
      const templateSetting = settings.find(s => s.key === 'whatsapp_otp_template');
      if (templateSetting) activeTemplate = templateSetting.value;

      const userSetting = settings.find(s => s.key === 'whatsapp_otp_user');
      if (userSetting) apiUser = userSetting.value;

      const passSetting = settings.find(s => s.key === 'whatsapp_otp_pass');
      if (passSetting) apiPass = passSetting.value;

      const senderSetting = settings.find(s => s.key === 'whatsapp_otp_sender');
      if (senderSetting) apiSender = senderSetting.value;
      
      console.log('[OTP] Loaded dynamic settings from DB. User:', apiUser, 'Template:', activeTemplate);
    }
  } catch (dbErr) {
    console.warn('[OTP] Could not fetch dynamic settings from DB, using defaults:', dbErr.message);
  }

  const httpsUrl = `https://bhashsms.com/api/sendmsg.php?user=${apiUser}&pass=${apiPass}&sender=${apiSender}&phone=${cleanPhone}&text=${activeTemplate}&priority=wa&stype=normal&Params=${otp},OTP`;
  const httpUrl = `http://bhashsms.com/api/sendmsg.php?user=${apiUser}&pass=${apiPass}&sender=${apiSender}&phone=${cleanPhone}&text=${activeTemplate}&priority=wa&stype=normal&Params=${otp},OTP`;

  console.log(`[OTP] Initiating serial dispatch with template "${activeTemplate}"...`);

  const attemptDispatch = async (url, useFetch = false, methodLabel = '') => {
    console.log(`[OTP] [Cascading] Starting attempt: ${methodLabel}`);
    const startTime = Date.now();
    try {
      let responseText = '';
      if (useFetch) {
        // Native fetch abort controller for standard 15s timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(url, {
          method: 'GET',
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        responseText = await res.text();
      } else {
        const res = await axios.get(url, {
          timeout: 15000,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        responseText = res.data;
      }
      
      const duration = Date.now() - startTime;
      console.log(`[OTP] [Cascading] ${methodLabel} finished in ${duration}ms. Response:`, responseText);
      
      // Safe string conversion for responseText (prevents TypeError in includes if JSON/Object is returned)
      const responseStr = typeof responseText === 'string' 
        ? responseText 
        : (responseText ? JSON.stringify(responseText) : '');

      const upperStr = responseStr.toUpperCase();

      // Only fail if the gateway explicitly returned an error keyword
      if (upperStr.includes('ERR') || upperStr.includes('FAIL') || upperStr.includes('INVALID')) {
        throw new Error(`${methodLabel} returned explicit error: ${responseStr}`);
      }
      
      // Otherwise, any 200 OK response (even if empty or a transaction code) is a success!
      return responseStr || 'SUCCESS';
    } catch (err) {
      const duration = Date.now() - startTime;
      console.warn(`[OTP] [Cascading] ${methodLabel} failed in ${duration}ms:`, err.message);
      throw err;
    }
  };

  let result;
  let dispatchError = null;

  // 2. Serial Staged execution: HTTPS first, fallback to HTTP Axios, fallback to HTTP Native Fetch
  try {
    result = await attemptDispatch(httpsUrl, false, 'HTTPS (Axios)');
  } catch (err1) {
    console.log('[OTP] HTTPS (Axios) failed, trying HTTP (Axios)...');
    try {
      result = await attemptDispatch(httpUrl, false, 'HTTP (Axios)');
    } catch (err2) {
      console.log('[OTP] HTTP (Axios) failed, trying HTTP (Native Fetch)...');
      try {
        result = await attemptDispatch(httpUrl, true, 'HTTP (Native Fetch)');
      } catch (err3) {
        dispatchError = err3;
      }
    }
  }

  if (result) {
    console.log('[OTP] Serial Dispatch resolved successfully:', result);

    // 3. Log success in Supabase otp_logs
    try {
      await supabase.from('otp_logs').insert({
        phone_number: cleanPhone,
        otp_code: otp,
        template_used: activeTemplate,
        status: 'Success',
        response_gateway: result
      });
      console.log('[OTP] Saved delivery success log in DB.');
    } catch (logErr) {
      console.warn('[OTP] Failed to write success log in Supabase:', logErr.message);
    }

    return result;
  } else {
    const finalErr = dispatchError || new Error('All serial dispatch attempts failed');
    console.error('[OTP] Serial Dispatch Critical Failure:', finalErr.message);

    // 4. Log failure in Supabase otp_logs
    try {
      await supabase.from('otp_logs').insert({
        phone_number: cleanPhone,
        otp_code: otp,
        template_used: activeTemplate,
        status: 'Failed',
        response_gateway: finalErr.message
      });
      console.log('[OTP] Saved delivery failure log in DB.');
    } catch (logErr) {
      console.warn('[OTP] Failed to write failure log in Supabase:', logErr.message);
    }

    throw new Error('Failed to send WhatsApp OTP. Please try again.');
  }
};
