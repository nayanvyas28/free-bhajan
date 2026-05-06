import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import { User, LogIn, Languages } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const Header = () => {
  const { theme } = useTheme();
  const { profile, isAuthenticated } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const navigation = useNavigation();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
      <View style={styles.logoSection}>
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Mantra Puja</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>{t('spiritualLibrary')}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.langBtn, { backgroundColor: theme.card, borderColor: theme.primary + '33' }]}
          onPress={toggleLanguage}
        >
          <Languages size={18} color={theme.primary} />
          <Text style={[styles.langText, { color: theme.primary }]}>
            {language === 'en' ? 'हि' : 'EN'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => isAuthenticated ? navigation.navigate('Profile') : navigation.navigate('Login')}
        >
          {isAuthenticated ? (
            <LinearGradient
              colors={[theme.primary, '#FF9100']}
              style={styles.profileCircle}
            >
              <Text style={styles.initials}>{getInitials(profile?.full_name)}</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.profileCircle, { backgroundColor: theme.card }]}>
              <User size={20} color={theme.subtext} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  langText: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
  },
});

export default Header;
