import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Trash2, AlertCircle } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function ConfirmationModal({ visible, title, message, onConfirm, onCancel, confirmText, cancelText, type = 'danger' }) {
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <BlurView intensity={isDark ? 30 : 50} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
        
        <View style={[styles.modalContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.iconContainer, { backgroundColor: type === 'danger' ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255, 179, 0, 0.1)' }]}>
            <AlertCircle size={32} color={type === 'danger' ? '#FF3B30' : theme.primary} />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.subtext }]}>{message}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelBtn, { borderColor: theme.border }]} 
              onPress={onCancel}
            >
              <Text style={[styles.btnText, { color: theme.text }]}>{cancelText || t('cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.confirmBtn, { backgroundColor: type === 'danger' ? '#FF3B30' : theme.primary }]} 
              onPress={onConfirm}
            >
              <Text style={[styles.btnText, { color: '#FFF' }]}>{confirmText || t('confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
    borderWidth: 1,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1.5,
  },
  confirmBtn: {
    elevation: 2,
  },
  btnText: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  }
});
