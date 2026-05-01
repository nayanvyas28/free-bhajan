import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { User, LogIn, Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const Header = () => {
  const { theme } = useTheme();
  const { profile, isAuthenticated } = useAuth();
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
          <Text style={[styles.subtitle, { color: theme.subtext }]}>Spiritual Library</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.iconBtn, { backgroundColor: theme.card }]}
          onPress={() => navigation.navigate('Favorites')}
        >
          <Heart size={20} color={theme.primary} />
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
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
