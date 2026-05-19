import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { AlertCircle } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function ConfirmationModal({ visible, title, message, onConfirm, onCancel, confirmText, cancelText, type = 'danger' }) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  if (!visible) return null;

  const accentColor = type === 'danger' ? '#FF3B30' : theme.primary;

  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 120000 }]}>
      <View style={styles.overlay}>
        <BlurView intensity={40} style={StyleSheet.absoluteFill} tint="dark" />
        
        <View style={[
          styles.modalContainer, 
          { 
            backgroundColor: 'rgba(11, 11, 11, 0.94)', 
            borderColor: `${accentColor}30`,
            shadowColor: accentColor
          }
        ]}>
          <LinearGradient
            colors={[`${accentColor}15`, 'transparent']}
            style={styles.modalGradient}
          />
          
          <View style={[styles.iconContainer, { backgroundColor: `${accentColor}15` }]}>
            <AlertCircle size={32} color={accentColor} />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.subtext }]}>{message}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelBtn, { borderColor: 'rgba(255,255,255,0.08)' }]} 
              onPress={onCancel}
            >
              <Text style={[styles.btnText, { color: theme.text }]}>{cancelText || t('cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.confirmBtn, { backgroundColor: accentColor }]} 
              onPress={onConfirm}
            >
              <Text style={[styles.btnText, { color: '#000' }]}>{confirmText || t('confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: width * 0.85,
    padding: 24,
    borderRadius: 28,
    borderWidth: 1.5,
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
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    marginBottom: 10,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    opacity: 0.8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  confirmBtn: {
    elevation: 3,
  },
  btnText: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  }
});
