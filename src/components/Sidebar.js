import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import { 
  Home, 
  Heart, 
  Calendar, 
  Settings, 
  Info, 
  X, 
  ChevronRight,
  Music,
  Flame,
  BookOpen,
  Sparkles,
  Gift
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

export default function Sidebar() {
  const { theme, isDarkMode } = useTheme();
  const { isOpen, closeSidebar } = useSidebar();
  const { t } = useLanguage();
  const navigation = useNavigation();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const handleNav = (screen, params = {}) => {
    closeSidebar();
    navigation.navigate(screen, params);
  };

  const menuItems = [
    { id: 'home', title: t('home') || 'Home', icon: Home, screen: 'MainTabs', params: { screen: 'HomeTab', params: { screen: 'Home' } } },
    { id: 'liked', title: t('liked') || 'Liked Content', icon: Heart, screen: 'Favorites' },
    { id: 'calendar', title: t('calendar') || 'Spiritual Calendar', icon: Calendar, screen: 'MainTabs', params: { screen: 'HomeTab', params: { screen: 'Calendar' } } },
    { id: 'katha', title: 'Vrat Katha', icon: BookOpen, screen: 'Katha', params: { kathaId: 'latest' } },
    { id: 'solutions', title: 'Solutions (Upay)', icon: Sparkles, screen: 'MainTabs', params: { screen: 'Solution' } },
    { id: 'aarti', title: 'MantraPuja Aarti', icon: Flame, screen: 'MainTabs', params: { screen: 'Aarti' } },
    { id: 'audio', title: 'Audio Bhajans', icon: Music, screen: 'Audio' },
    { id: 'referral', title: 'Refer & Earn', icon: Gift, screen: 'Referral' },
  ];

  const secondaryItems = [
    { id: 'settings', title: t('settings') || 'Settings', icon: Settings, screen: 'Settings' },
    { id: 'about', title: t('about') || 'About Us', icon: Info, screen: 'About' },
  ];

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SIDEBAR_WIDTH, 0],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (!isOpen && anim._value === 0) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]} pointerEvents={isOpen ? 'auto' : 'none'}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={closeSidebar}>
        <Animated.View style={[styles.backdrop, { opacity }]}>
          <BlurView intensity={isDarkMode ? 20 : 10} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </TouchableWithoutFeedback>

      {/* Sidebar Content */}
      <Animated.View style={[
        styles.drawer, 
        { 
          backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          transform: [{ translateX }],
          borderRightColor: theme.border,
        }
      ]}>
        <LinearGradient
          colors={isDarkMode ? ['rgba(30, 41, 59, 0.5)', 'transparent'] : ['rgba(241, 245, 249, 0.5)', 'transparent']}
          style={styles.drawerGradient}
        />

        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={[styles.logoCircle, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
              <Image 
                source={require('../../assets/logo.png')} 
                style={{ width: 28, height: 28 }} 
                resizeMode="contain" 
              />
            </View>
            <View>
              <Text style={[styles.brand, { color: theme.text }]}>MantraPuja</Text>
              <Text style={[styles.tagline, { color: theme.primary }]}>Bhajan Library</Text>
            </View>
          </View>
          <TouchableOpacity onPress={closeSidebar} style={styles.closeBtn}>
            <X size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.menuScroll}>
          <Text style={[styles.sectionTitle, { color: theme.subtext }]}>MAIN MENU</Text>
          {menuItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.menuItem}
              onPress={() => handleNav(item.screen, item.params)}
            >
              <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                <item.icon size={20} color={theme.primary} />
              </View>
              <Text style={[styles.menuText, { color: theme.text }]}>
                {item.title.charAt(0).toUpperCase() + item.title.slice(1)}
              </Text>
              <ChevronRight size={16} color={theme.border} />
            </TouchableOpacity>
          ))}

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Text style={[styles.sectionTitle, { color: theme.subtext }]}>PREFERENCES</Text>
          {secondaryItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.menuItem}
              onPress={() => handleNav(item.screen)}
            >
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                <item.icon size={20} color={theme.text} />
              </View>
              <Text style={[styles.menuText, { color: theme.text }]}>
                {item.title.charAt(0).toUpperCase() + item.title.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <Text style={[styles.version, { color: theme.subtext }]}>v1.1.0 Stable</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  drawer: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    borderRightWidth: 1,
    paddingTop: 60,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  drawerGradient: {
    ...StyleSheet.absoluteFillObject,
    height: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brand: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
  },
  tagline: {
    fontSize: 12,
    fontFamily: 'Outfit-Black',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  menuScroll: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Outfit-Black',
    letterSpacing: 1.5,
    marginBottom: 16,
    marginTop: 24,
    paddingHorizontal: 8,
    opacity: 0.6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Outfit-Medium',
  },
  divider: {
    height: 1,
    marginVertical: 20,
    marginHorizontal: 8,
    opacity: 0.3,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  version: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    opacity: 0.5,
  }
});
