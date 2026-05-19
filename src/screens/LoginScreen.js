import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useCustomAlert } from '../context/AlertContext';
import { Phone, MessageSquare, ArrowRight, User, Gift } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { startWhatsAppLogin, verifyWhatsAppLogin, checkUserExists } = useAuth();
  const { showAlert } = useCustomAlert();
  
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [showNameField, setShowNameField] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [referralCode, setReferralCode] = useState('');

  // Handle countdown timer
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    const initReferrals = async () => {
      const referrerFound = await checkInstallReferrerForReferral();
      if (!referrerFound) {
        await checkClipboardForReferral();
      }
    };
    initReferrals();
  }, []);

  const checkInstallReferrerForReferral = async () => {
    try {
      let InstallReferrer = null;
      try {
        InstallReferrer = require('react-native-install-referrer').default || require('react-native-install-referrer');
      } catch (e) {
        console.log('[AUTH] react-native-install-referrer module not available');
      }

      if (InstallReferrer && typeof InstallReferrer.getReferrer === 'function') {
        const referrerData = await InstallReferrer.getReferrer();
        console.log('[AUTH] Install Referrer response:', referrerData);
        if (referrerData && referrerData.installReferrer) {
          const referrerStr = referrerData.installReferrer;
          const match = referrerStr.match(/ref_([A-Z0-9]{6})/i) ||
                        referrerStr.match(/utm_source=([A-Z0-9]{6})/i) || 
                        referrerStr.match(/referrer=([A-Z0-9]{6})/i) ||
                        referrerStr.match(/code=([A-Z0-9]{6})/i) ||
                        referrerStr.match(/\b([A-Z0-9]{6})\b/i);
          if (match && match[1]) {
            const detectedCode = match[1].toUpperCase();
            setReferralCode(detectedCode);
            console.log('[AUTH] Auto-filled referral code from Install Referrer:', detectedCode);
            return true;
          }
        }
      }
    } catch (e) {
      console.log('[AUTH] Install Referrer check failed:', e);
    }
    return false;
  };

  const checkClipboardForReferral = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        // Find 6-char alphanumeric code in clipboard text
        const match = text.match(/(?:code:|REF-|refer\/|ref_)([A-Z0-9]{6})/i) || text.match(/\b([A-Z0-9]{6})\b/i);
        if (match && match[1]) {
          const detectedCode = match[1].toUpperCase();
          setReferralCode(detectedCode);
          console.log('[AUTH] Auto-filled referral code from clipboard:', detectedCode);
          return true;
        }
      }
    } catch (e) {
      console.log('[AUTH] Clipboard check failed:', e);
    }
    return false;
  };

  const handleNext = async () => {
    if (phone.length < 10) {
      showAlert({
        title: t('invalidPhone'),
        message: t('enterValidPhone'),
        type: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const existingUser = await checkUserExists(formattedPhone);
      
      console.log('[LOGIN] Data returned from checkUserExists:', existingUser);

      if (existingUser) {
        console.log('[LOGIN] Existing User Found:', existingUser);
        setIsExistingUser(true);
        setName(existingUser.full_name || '');
        await startWhatsAppLogin(formattedPhone);
        setTimer(60);
        setStep(2);
        setShowNameField(false);
      } else {
        console.log('[LOGIN] No existing user found for:', formattedPhone);
        setIsExistingUser(false);
        setShowNameField(true);
      }
    } catch (error) {
      showAlert({ title: t('error'), message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!name) {
      showAlert({
        title: t('nameRequired'),
        message: t('enterYourName'),
        type: 'warning'
      });
      return;
    }
    
    setLoading(true);
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const response = await startWhatsAppLogin(formattedPhone);
      if (response) {
        setTimer(60);
        setStep(2);
      }
    } catch (error) {
      showAlert({
        title: t('error'),
        message: error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };


  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      showAlert({
        title: t('invalidOtp'),
        message: t('enterSixDigit'),
        type: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      await verifyWhatsAppLogin(formattedPhone, otp, name, referralCode);
      navigation.goBack();
    } catch (error) {
      showAlert({
        title: t('verificationFailed'),
        message: error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <LinearGradient
          colors={[theme.primary, '#FF9100']}
          style={styles.logoCircle}
        >
          <User size={40} color="#FFF" />
        </LinearGradient>
        <Text style={[styles.title, { color: theme.text }]}>
          {step === 1 ? t('namaste') : t('verifyWhatsApp')}
        </Text>
        <Text style={[styles.subtitle, { color: theme.subtext }]}>
          {step === 1 
            ? (showNameField ? t('createProfile') : t('signInWhatsApp'))
            : `${t('enterCodeSent')} +91 ${phone}`}
        </Text>
      </View>

      <View style={styles.form}>
        {step === 1 ? (
          <>
            <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Phone size={20} color={theme.primary} style={styles.inputIcon} />
              <View style={styles.prefixWrapper}>
                <Text style={[styles.prefix, { color: theme.text }]}>+91</Text>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
              </View>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder={t('whatsappNumber')}
                placeholderTextColor={theme.subtext}
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={(val) => {
                  setPhone(val);
                  if (showNameField) setShowNameField(false);
                }}
                disabled={loading}
              />
            </View>

            {showNameField && (
              <>
                <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <User size={20} color={theme.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder={t('yourName')}
                    placeholderTextColor={theme.subtext}
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Gift size={20} color={theme.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder={t('referralCode') || 'Referral Code (Optional)'}
                    placeholderTextColor={theme.subtext}
                    value={referralCode}
                    onChangeText={setReferralCode}
                    autoCapitalize="characters"
                  />
                </View>
              </>
            )}

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={showNameField ? handleSendOtp : handleNext}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>
                    {showNameField ? t('getWhatsAppOtp') : t('next')}
                  </Text>
                  <ArrowRight size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <MessageSquare size={20} color={theme.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder={t('enterOtp')}
                placeholderTextColor={theme.subtext}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
            </View>

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>{t('verifyLogin')}</Text>
                  <ArrowRight size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.resendBtn}
              onPress={handleSendOtp}
              disabled={loading || timer > 0}
            >
              <Text style={[styles.resendText, { color: timer > 0 ? theme.subtext : theme.primary }]}>
                {timer > 0 ? `${t('resendIn')} ${timer}s` : t('resendOtp')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.changePhoneBtn}
              onPress={() => {
                setStep(1);
                setShowNameField(false);
              }}
              disabled={loading}
            >
              <Text style={[styles.changePhoneText, { color: theme.subtext }]}>{t('changePhone')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 50 },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 10,
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  title: { fontSize: 32, fontFamily: 'Outfit-Bold', marginBottom: 8 },
  subtitle: { fontSize: 16, fontFamily: 'Outfit-Medium', textAlign: 'center' },
  form: { gap: 16 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 20,
  },
  inputIcon: { marginRight: 16 },
  prefixWrapper: { flexDirection: 'row', alignItems: 'center' },
  prefix: { fontSize: 16, fontFamily: 'Outfit-Bold', marginRight: 12 },
  divider: { width: 1, height: 24, marginRight: 16 },
  input: { flex: 1, fontSize: 16, fontFamily: 'Outfit-SemiBold' },
  button: {
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
    elevation: 8,
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  buttonText: { color: '#FFF', fontSize: 18, fontFamily: 'Outfit-Bold' },
  resendBtn: { marginTop: 10, alignItems: 'center' },
  resendText: { fontSize: 15, fontFamily: 'Outfit-Bold' },
  changePhoneBtn: { marginTop: 15, alignItems: 'center' },
  changePhoneText: { fontSize: 14, fontFamily: 'Outfit-Medium', textDecorationLine: 'underline' },
});
