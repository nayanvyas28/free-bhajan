import React, { createContext, useState, useContext } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, BlurView } from 'react-native';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react-native';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState({
    title: '',
    message: '',
    type: 'info', // info, success, error, warning
    buttons: []
  });

  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  const showAlert = ({ title, message, type = 'info', buttons = [] }) => {
    setConfig({ title, message, type, buttons });
    setVisible(true);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 8 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true })
    ]).start();
  };

  const hideAlert = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 200, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true })
    ]).start(() => setVisible(false));
  };

  const getIcon = () => {
    const size = 32;
    switch (config.type) {
      case 'success': return <CheckCircle2 size={size} color="#4ADE80" />;
      case 'error': return <XCircle size={size} color="#F87171" />;
      case 'warning': return <AlertCircle size={size} color="#FB923C" />;
      default: return <Info size={size} color={theme.primary} />;
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <Modal visible={visible} transparent animationType="none">
        <View style={styles.overlay}>
          <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
            <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={hideAlert} />
          </Animated.View>
          
          <Animated.View style={[
            styles.alertBox, 
            { 
              backgroundColor: theme.card, 
              borderColor: theme.border,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim
            }
          ]}>
            <View style={styles.iconContainer}>
              {getIcon()}
            </View>
            
            <Text style={[styles.title, { color: theme.text }]}>{config.title}</Text>
            <Text style={[styles.message, { color: theme.subtext }]}>{config.message}</Text>
            
            <View style={styles.buttonContainer}>
              {config.buttons.length > 0 ? (
                config.buttons.map((btn, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={[
                      styles.button, 
                      btn.style === 'destructive' ? styles.destBtn : { backgroundColor: theme.primary },
                      index > 0 && { marginLeft: 12 }
                    ]}
                    onPress={() => {
                      if (btn.onPress) btn.onPress();
                      hideAlert();
                    }}
                  >
                    <Text style={[styles.btnText, btn.style === 'destructive' && { color: '#FF3B30' }]}>
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: theme.primary }]}
                  onPress={hideAlert}
                >
                  <Text style={styles.btnText}>OK</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

export const useCustomAlert = () => useContext(AlertContext);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  alertBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  iconContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    fontFamily: 'Outfit-Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  destBtn: {
    backgroundColor: 'rgba(255,59,48,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.2)',
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
  }
});
