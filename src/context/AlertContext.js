import React, { createContext, useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

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
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 8, tension: 40 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true })
    ]).start();
  };

  const hideAlert = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 200, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true })
    ]).start(() => setVisible(false));
  };

  const getColor = () => {
    switch (config.type) {
      case 'success': return '#4ADE80';
      case 'error': return '#F87171';
      case 'warning': return '#F5B041'; // Gold
      default: return '#00D1FF'; // Electric Blue
    }
  };

  const getIcon = () => {
    const size = 32;
    const color = getColor();
    switch (config.type) {
      case 'success': return <CheckCircle2 size={size} color={color} />;
      case 'error': return <XCircle size={size} color={color} />;
      case 'warning': return <AlertCircle size={size} color={color} />;
      default: return <Info size={size} color={color} />;
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {visible && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 120000 }]}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
            <View style={styles.overlay}>
              <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
                <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={hideAlert} />
              </Animated.View>
              
              <Animated.View style={[
                styles.alertBox, 
                { 
                  backgroundColor: 'rgba(11, 11, 11, 0.94)', 
                  borderColor: `${getColor()}40`,
                  shadowColor: getColor(),
                  transform: [{ scale: scaleAnim }],
                  opacity: opacityAnim
                }
              ]}>
                <LinearGradient
                  colors={[`${getColor()}15`, 'transparent']}
                  style={styles.modalGradient}
                />
                
                <View style={[styles.iconContainer, { backgroundColor: `${getColor()}15` }]}>
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
                          btn.style === 'destructive' 
                            ? { backgroundColor: 'rgba(248, 113, 113, 0.1)', borderColor: 'rgba(248, 113, 113, 0.25)', borderWidth: 1 } 
                            : { backgroundColor: getColor() },
                          index > 0 && { marginLeft: 12 }
                        ]}
                        onPress={() => {
                          if (btn.onPress) btn.onPress();
                          hideAlert();
                        }}
                      >
                        <Text style={[styles.btnText, { color: btn.style === 'destructive' ? '#F87171' : '#000' }]}>
                          {btn.text}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <TouchableOpacity 
                      style={[styles.button, { backgroundColor: getColor() }]}
                      onPress={hideAlert}
                    >
                      <Text style={[styles.btnText, { color: '#000' }]}>OK</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>
            </View>
          </BlurView>
        </View>
      )}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  alertBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 28,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    elevation: 25,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    overflow: 'hidden',
  },
  modalGradient: {
    ...StyleSheet.absoluteFillObject,
    height: 120,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  iconContainer: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 22,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    opacity: 0.8,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  btnText: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  }
});
