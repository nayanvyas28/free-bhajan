import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import { User, LogIn, Languages, Menu, Search, Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSidebar } from '../context/SidebarContext';

const Header = ({ customTitle, customSubtitle }) => {
  const { theme, isDarkMode } = useTheme();
  const { profile, isAuthenticated } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const { toggleSidebar } = useSidebar();
  const navigation = useNavigation();

  const getInitials = (name) => {
    if (!name || name === 'undefined') return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)', borderBottomColor: theme.border }]}>
      <View style={styles.logoSection}>
        <TouchableOpacity 
          onPress={toggleSidebar} 
          style={styles.menuHandle}
          activeOpacity={0.7}
        >
          <View style={[styles.menuLine, { backgroundColor: theme.primary }]} />
          <View style={[styles.menuLine, { backgroundColor: theme.primary, width: 16 }]} />
          <View style={[styles.menuLine, { backgroundColor: theme.primary, width: 20 }]} />
        </TouchableOpacity>
        
        <View style={{ flex: 1, marginLeft: 4 }}>
          <Text 
            style={[styles.title, { color: theme.text }]} 
            numberOfLines={1} 
            ellipsizeMode="tail"
          >
            {customTitle || 'MantraPuja'}
          </Text>
          <Text 
            style={[styles.subtitle, { color: theme.subtext }]} 
            numberOfLines={1}
          >
            {customSubtitle || t('spiritualLibrary')}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.iconBtn, { backgroundColor: theme.card }]}
          onPress={() => navigation.navigate('Calendar')}
        >
          <Calendar size={20} color={theme.text} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.langBtn, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '33' }]}
          onPress={toggleLanguage}
        >
          <Text style={[styles.langText, { color: theme.primary }]}>
            {language === 'en' ? 'हि' : 'EN'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => isAuthenticated ? navigation.navigate('Profile') : navigation.navigate('Login')}
        >
          {isAuthenticated ? (
            <View style={styles.profileWrapper}>
              <LinearGradient
                colors={[theme.primary, '#FF9100']}
                style={styles.profileCircle}
              >
                <Text style={styles.initials} numberOfLines={1}>{getInitials(profile?.full_name || profile?.username)}</Text>
              </LinearGradient>
              <View style={[styles.onlineStatus, { backgroundColor: '#10B981' }]} />
            </View>
          ) : (
            <View style={[styles.profileCircle, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }]}>
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
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  logoSection: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    flex: 1,
    marginRight: 5
  },
  menuHandle: {
    paddingVertical: 10,
    paddingRight: 10,
    gap: 4,
  },
  menuLine: {
    height: 3,
    width: 24,
    borderRadius: 2,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    letterSpacing: -0.5,
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  langText: {
    fontSize: 13,
    fontFamily: 'Outfit-Black',
  },
  profileWrapper: {
    position: 'relative',
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  onlineStatus: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  initials: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
  },
});

export default Header;
