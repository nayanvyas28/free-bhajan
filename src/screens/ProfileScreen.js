import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Share
} from 'react-native';
import { CONFIG } from '../constants/Config';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useCustomAlert } from '../context/AlertContext';
import { useSidebar } from '../context/SidebarContext';
import { usePlayer } from '../context/PlayerContext';
import ScreenWrapper from '../components/ScreenWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { User, LogOut, Save, ChevronLeft, Info, ChevronRight, Palette, Sun, Moon, Monitor, Heart, Languages, Share2 } from 'lucide-react-native';

export default function ProfileScreen({ navigation }) {
  const { theme, themeMode, setThemeMode, isDarkMode } = useTheme();
  const { profile, signOut, updateProfile } = useAuth();
  const { t } = useLanguage();
  const { showAlert } = useCustomAlert();
  const { closePlayer } = usePlayer();
  
  const [name, setName] = useState(profile?.full_name || '');
  const [loading, setLoading] = useState(false);

  const handleUpdateName = async () => {
    if (!name.trim()) {
      showAlert({
        title: t('error'),
        message: t('nameEmpty'),
        type: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      await updateProfile({ full_name: name });
      showAlert({
        title: t('success'),
        message: t('profileUpdated'),
        type: 'success'
      });
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

  const handleSignOut = () => {
    showAlert({
      title: t('logout'),
      message: t('logoutConfirm') || 'Are you sure you want to sign out?',
      type: 'warning',
      buttons: [
        { text: t('cancel') || 'Cancel' },
        { 
          text: t('logout'), 
          style: 'destructive', 
          onPress: async () => {
            closePlayer();
            await signOut();
            navigation.replace('MainTabs');
          } 
        }
      ]
    });
  };

  const { language, setLanguage } = useLanguage();

  return (
    <ScreenWrapper hasTabBar={false}>
      <ScrollView style={[styles.container]} contentContainerStyle={{ paddingBottom: 150 }}>
        <LinearGradient
          colors={[theme.primary, 'rgba(0,0,0,0)']}
          style={styles.headerBackground}
        />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
            <ChevronLeft size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t('profile')}</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.profileSection}>
          <View style={[styles.avatarLarge, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,143,0,0.1)', borderColor: theme.border, borderWidth: 2, shadowColor: theme.shadow }]}>
            <Text style={[styles.avatarText, { color: theme.primary }]}>
              {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={[styles.phoneText, { color: theme.text }]}>{profile?.phone_number}</Text>
        </View>

        {profile && profile.id && (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.label, { color: theme.subtext }]}>{t('fullName')}</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: theme.border }]}>
              <User size={20} color={theme.primary} style={styles.icon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={name}
                onChangeText={setName}
                placeholder={t('yourName')}
                placeholderTextColor={theme.subtext}
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: theme.primary }]}
              onPress={handleUpdateName}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={isDarkMode ? "#000" : "#FFF"} />
              ) : (
                <>
                  <Save size={20} color={isDarkMode ? "#000" : "#FFF"} />
                  <Text style={[styles.saveBtnText, { color: isDarkMode ? "#000" : "#FFF" }]}>{t('saveChanges')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.menuContainer}>
          {/* THEME SECTION */}
          <View style={styles.sectionHeader}>
            <Palette size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('theme')}</Text>
          </View>

          <View style={styles.themeSelector}>
            {[
              { id: 'system', icon: Monitor, label: t('themeSystem') },
              { id: 'light', icon: Sun, label: t('themeLight') },
              { id: 'dark', icon: Moon, label: t('themeDark') },
            ].map((mode) => (
              <TouchableOpacity
                key={mode.id}
                onPress={() => setThemeMode(mode.id)}
                style={[
                  styles.themeBtn,
                  { backgroundColor: theme.surface, borderColor: 'rgba(255,255,255,0.05)' },
                  themeMode === mode.id && { backgroundColor: 'rgba(255,193,7,0.1)', borderColor: theme.primary }
                ]}
              >
                <mode.icon size={22} color={themeMode === mode.id ? theme.primary : theme.subtext} />
                <Text style={[
                  styles.themeBtnText, 
                  { color: themeMode === mode.id ? theme.primary : theme.subtext }
                ]}>{mode.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* LANGUAGE SECTION */}
          <View style={styles.sectionHeader}>
            <Languages size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('language') || 'Language'}</Text>
          </View>

          <View style={styles.themeSelector}>
            {[
              { id: 'hi', label: 'हिंदी (Hindi)' },
              { id: 'en', label: 'English' },
            ].map((lang) => (
              <TouchableOpacity
                key={lang.id}
                onPress={() => setLanguage(lang.id)}
                style={[
                  styles.themeBtn,
                  { backgroundColor: theme.surface, borderColor: 'rgba(255,255,255,0.05)' },
                  language === lang.id && { backgroundColor: 'rgba(255,193,7,0.1)', borderColor: theme.primary }
                ]}
              >
                <Text style={[
                  styles.themeBtnText, 
                  { color: language === lang.id ? theme.primary : theme.subtext, fontSize: 16 }
                ]}>{lang.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.surface, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 12 }]}
            onPress={() => navigation.navigate('Favorites')}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(255,59,48,0.1)' }]}>
                <Heart size={20} color="#FF3B30" fill="#FF3B30" />
              </View>
              <Text style={[styles.menuItemText, { color: theme.text }]}>{t('favorites')}</Text>
            </View>
            <ChevronRight size={20} color={theme.subtext} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: 12 }]}
            onPress={async () => {
              try {
                await Share.share({
                  message: `🙏 Jai Shree Ram! 🙏\n\nMain *${CONFIG.APP_NAME}* app use kar raha hoon Bhajans, Mantras aur Daily Panchang ke liye. Aap bhi download karein:\n\n${CONFIG.PLAY_STORE_URL}`,
                });
              } catch (e) {}
            }}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                <Share2 size={20} color="#4CAF50" />
              </View>
              <Text style={[styles.menuItemText, { color: theme.text }]}>{t('shareApp') || 'Share App'}</Text>
            </View>
            <ChevronRight size={20} color={theme.subtext} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.surface, borderColor: 'rgba(255,255,255,0.05)' }]}
            onPress={() => navigation.navigate('About')}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(255,179,0,0.1)' }]}>
                <Info size={20} color={theme.primary} />
              </View>
              <Text style={[styles.menuItemText, { color: theme.text }]}>{t('about')}</Text>
            </View>
            <ChevronRight size={20} color={theme.subtext} />
          </TouchableOpacity>
        </View>

        {profile && profile.id ? (
          <TouchableOpacity 
            style={[styles.signOutBtn, { borderColor: 'rgba(255, 59, 48, 0.2)', backgroundColor: 'rgba(255, 59, 48, 0.05)' }]}
            onPress={handleSignOut}
          >
            <LogOut size={20} color="#FF3B30" />
            <Text style={styles.signOutText}>{t('logout')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.signOutBtn, { borderColor: 'rgba(76, 175, 80, 0.2)', backgroundColor: 'rgba(76, 175, 80, 0.05)' }]}
            onPress={() => navigation.navigate('Login')}
          >
            <User size={20} color="#4CAF50" />
            <Text style={[styles.signOutText, { color: "#4CAF50" }]}>{t('login') || 'Login / Create Account'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    opacity: 0.2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 22, fontFamily: 'Outfit-Bold' },
  backBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatarText: { fontSize: 40, fontFamily: 'Outfit-Bold' },
  phoneText: { fontSize: 18, fontFamily: 'Outfit-Bold', letterSpacing: 1.5, marginTop: 4 },
  card: { 
    marginHorizontal: 20, 
    padding: 24, 
    borderRadius: 32, 
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  label: { fontSize: 11, fontFamily: 'Outfit-Black', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.5 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  menuContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
  },
  themeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  themeBtn: {
    flex: 1,
    height: 90,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  themeBtnText: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
  },
  icon: { marginRight: 15 },
  input: { flex: 1, fontSize: 16, fontFamily: 'Outfit-Bold' },
  saveBtn: {
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: 8,
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  saveBtnText: { fontSize: 16, fontFamily: 'Outfit-Bold' },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 40,
    marginHorizontal: 20,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
  },
  signOutText: { color: '#FF3B30', fontSize: 16, fontFamily: 'Outfit-Bold' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 70,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
  },
});
