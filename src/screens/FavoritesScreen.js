import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { getFavorites, removeFavorite } from '../storage/favorites';
import VideoCard from '../components/VideoCard';
import Header from '../components/Header';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Heart, Lock, LogIn } from 'lucide-react-native';

export default function FavoritesScreen({ navigation }) {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const { playVideo } = usePlayer();

  const loadFavorites = async () => {
    const data = await getFavorites();
    setFavorites(data);
  };

  useEffect(() => {
    if (isAuthenticated) {
      const unsubscribe = navigation.addListener('focus', () => {
        loadFavorites();
      });
      return unsubscribe;
    }
  }, [navigation, isAuthenticated]);

  const handleToggleFavorite = async (video) => {
    await removeFavorite(video.id.videoId);
    loadFavorites();
  };

  const renderItem = ({ item }) => (
    <VideoCard
      video={item}
      isFav={true}
      onFavorite={() => handleToggleFavorite(item)}
      onPress={() => playVideo(item, favorites)}
    />
  );

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Header title="My Favorites" />
        <View style={styles.authPrompt}>
          <View style={[styles.lockCircle, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Lock size={40} color={theme.primary} />
          </View>
          <Text style={[styles.authTitle, { color: theme.text }]}>Login Required</Text>
          <Text style={[styles.authSubtitle, { color: theme.subtext }]}>
            Sign in to sync your favorite divine melodies across all your devices.
          </Text>
          <TouchableOpacity 
            style={[styles.loginBtn, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('Login')}
          >
            <LogIn size={20} color="#FFF" />
            <Text style={styles.loginText}>Sign In Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="My Favorites" />

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id.videoId}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Heart size={64} color={theme.primary} fill={theme.card} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Favorites Yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>
              Save your favorite bhajans to listen to them anytime.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingTop: 16, paddingBottom: 100 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontFamily: 'Outfit-Bold', color: '#FFFFFF', marginTop: 20 },
  emptySubtitle: { fontSize: 14, fontFamily: 'Outfit-Medium', color: '#A0A0A0', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  authPrompt: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  lockCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  authTitle: { fontSize: 24, fontFamily: 'Outfit-Bold', marginBottom: 12 },
  authSubtitle: { fontSize: 16, fontFamily: 'Outfit-Medium', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  loginBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 32, paddingVertical: 18, borderRadius: 20, elevation: 8 },
  loginText: { color: '#FFF', fontSize: 18, fontFamily: 'Outfit-Bold' },
});
