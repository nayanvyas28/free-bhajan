import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, Save, ChevronLeft, Info } from 'lucide-react-native';

export default function ProfileScreen({ navigation }) {
  const { theme } = useTheme();
  const { profile, signOut, updateProfile } = useAuth();
  
  const [name, setName] = useState(profile?.full_name || '');
  const [loading, setLoading] = useState(false);

  const handleUpdateName = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({ full_name: name });
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            await signOut();
            navigation.navigate('Home');
          } 
        }
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Profile</Text>
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
        <Text style={[styles.label, { color: theme.subtext }]}>FULL NAME</Text>
        <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <User size={20} color={theme.primary} style={styles.icon} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
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
              <Text style={styles.saveBtnText}>Update Profile</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, { borderBottomColor: theme.border }]}
          onPress={() => navigation.navigate('About')}
        >
          <View style={styles.menuItemLeft}>
            <Info size={20} color={theme.primary} />
            <Text style={[styles.menuItemText, { color: theme.text }]}>About Mantra Puja</Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.signOutBtn, { borderColor: '#FF3B30' }]}
        onPress={handleSignOut}
      >
        <LogOut size={20} color="#FF3B30" />
        <Text style={styles.signOutText}>Sign Out</Text>
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
    paddingVertical: 15,
    borderBottomWidth: 1,
    marginTop: 10,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: 'Outfit-Medium',
  },
});
