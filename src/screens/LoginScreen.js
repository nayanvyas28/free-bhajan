import React, { useState } from 'react';
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
import { Phone, MessageSquare, ArrowRight, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { startWhatsAppLogin, verifyWhatsAppLogin } = useAuth();
  const { showAlert } = useCustomAlert();
  
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [showNameField, setShowNameField] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const { checkUserExists } = useAuth();

  // Handle countdown timer
  React.useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

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
      
      if (existingUser) {
        setIsExistingUser(true);
        setName(existingUser.full_name);
        await startWhatsAppLogin(formattedPhone);
        setTimer(60);
        setStep(2);
      } else {
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
      await startWhatsAppLogin(formattedPhone);
      setTimer(60);
      setStep(2);
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
      await verifyWhatsAppLogin(formattedPhone, otp, name);
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
              <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <User size={20} color={theme.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder={t('yourName')}
                  placeholderTextColor={theme.subtext}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                />
              </View>
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
