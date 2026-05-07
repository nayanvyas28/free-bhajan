import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useCustomAlert } from '../context/AlertContext';
import { User, LogOut, Save, ChevronLeft, Info, ChevronRight, Palette, Sun, Moon, Monitor } from 'lucide-react-native';

export default function ProfileScreen({ navigation }) {
  const { theme, themeMode, setThemeMode } = useTheme();
  const { profile, signOut, updateProfile } = useAuth();
  const { t } = useLanguage();
  const { showAlert } = useCustomAlert();
  
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
            await signOut();
            navigation.replace('Main');
          } 
        }
      ]
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('profile')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.profileSection}>
        <View style={[styles.avatarLarge, { backgroundColor: theme.primary }]}>
          <Text style={styles.avatarText}>
            {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={[styles.phoneText, { color: theme.subtext }]}>{profile?.phone_number}</Text>
      </View>

      <View style={styles.form}>
        <Text style={[styles.label, { color: theme.subtext }]}>{t('fullName')}</Text>
        <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
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
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Save size={20} color="#FFF" />
              <Text style={styles.saveBtnText}>{t('saveChanges')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.menuContainer}>
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
                { backgroundColor: theme.card, borderColor: theme.border },
                themeMode === mode.id && { backgroundColor: theme.primary + '15', borderColor: theme.primary }
              ]}
            >
              <mode.icon size={20} color={themeMode === mode.id ? theme.primary : theme.subtext} />
              <Text style={[
                styles.themeBtnText, 
                { color: themeMode === mode.id ? theme.primary : theme.subtext }
              ]}>{mode.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.menuItem, { backgroundColor: theme.card, borderColor: theme.border }]}
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

      <TouchableOpacity 
        style={[styles.signOutBtn, { borderColor: '#FF3B30' }]}
        onPress={handleSignOut}
      >
        <LogOut size={20} color="#FF3B30" />
        <Text style={styles.signOutText}>{t('logout')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 20, fontFamily: 'Outfit-Bold' },
  backBtn: { padding: 4 },
  profileSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  avatarText: { color: '#FFF', fontSize: 40, fontFamily: 'Outfit-Bold' },
  phoneText: { fontSize: 16, fontFamily: 'Outfit-Medium' },
  form: { paddingHorizontal: 25 },
  label: { fontSize: 12, fontFamily: 'Outfit-Bold', marginBottom: 8, marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  menuContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
  },
  themeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  themeBtn: {
    flex: 1,
    height: 80,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  themeBtnText: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
  },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontFamily: 'Outfit-SemiBold' },
  saveBtn: {
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 4,
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontFamily: 'Outfit-Bold' },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 60,
    marginHorizontal: 25,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  signOutText: { color: '#FF3B30', fontSize: 16, fontFamily: 'Outfit-Bold' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
  },
});
