import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { getFavorites, removeFavorite } from '../storage/favorites';
import VideoCard from '../components/VideoCard';
import Header from '../components/Header';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Heart, Lock, LogIn } from 'lucide-react-native';
import ConfirmationModal from '../components/ConfirmationModal';

export default function FavoritesScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState('video');
  const [showConfirm, setShowConfirm] = useState(false);
  const [videoToRemove, setVideoToRemove] = useState(null);
  const { playVideo } = usePlayer();

  const loadFavorites = async () => {
    const data = await getFavorites();
    setFavorites(data || []);
  };

  useEffect(() => {
    if (isAuthenticated) {
      const unsubscribe = navigation.addListener('focus', () => {
        loadFavorites();
      });
      return unsubscribe;
    }
  }, [navigation, isAuthenticated]);

  const filteredData = favorites.filter(item => 
    activeTab === 'video' ? (item.type === 'youtube' || !item.type) : (item.type === 'audio')
  );

  const handleToggleFavorite = (video) => {
    setVideoToRemove(video);
    setShowConfirm(true);
  };

  const confirmRemove = async () => {
    if (videoToRemove) {
      await removeFavorite(videoToRemove.id?.videoId || videoToRemove.id);
      loadFavorites();
    }
    setShowConfirm(false);
    setVideoToRemove(null);
  };

  const renderItem = ({ item }) => {
    if (activeTab === 'audio') {
      // Robust image detection for both curated and youtube items
      const imageUrl = 
        item.thumbnail || 
        item.snippet?.thumbnails?.high?.url || 
        item.snippet?.thumbnails?.medium?.url || 
        item.snippet?.thumbnails?.default?.url ||
        item.image_url;
      
      return (
        <TouchableOpacity 
          style={styles.audioItem}
          onPress={() => playVideo(item, filteredData)}
        >
          <Image 
            source={{ uri: imageUrl || 'https://via.placeholder.com/150' }} 
            style={styles.audioThumbnail} 
            resizeMode="cover"
          />
          
          <View style={styles.audioDetails}>
            <Text style={[styles.audioTitle, { color: theme.text }]} numberOfLines={1}>
              {item.title || item.snippet?.title}
            </Text>
            <Text style={[styles.audioSubtitle, { color: theme.subtext }]} numberOfLines={1}>
              {item.category || item.snippet?.channelTitle || 'Bhajan'}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.audioFavBtn} 
            onPress={() => handleToggleFavorite(item)}
          >
            <Heart size={20} color="#FF3B30" fill="#FF3B30" />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }

    return (
      <VideoCard
        video={item}
        isFav={true}
        onFavorite={() => handleToggleFavorite(item)}
        onPress={() => playVideo(item, filteredData)}
      />
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Header title={t('favorites')} />
        <View style={styles.authPrompt}>
          <View style={[styles.lockCircle, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Lock size={40} color={theme.primary} />
          </View>
          <Text style={[styles.authTitle, { color: theme.text }]}>{t('loginRequired') || 'Login Required'}</Text>
          <Text style={[styles.authSubtitle, { color: theme.subtext }]}>
            {t('loginPrompt') || 'Sign in to sync your favorite divine melodies across all your devices.'}
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
      <Header title={t('favorites')} />

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'video' && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]}
          onPress={() => setActiveTab('video')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'video' ? theme.primary : theme.subtext }]}>
            VIDEOS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'audio' && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]}
          onPress={() => setActiveTab('audio')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'audio' ? theme.primary : theme.subtext }]}>
            AUDIO
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id?.videoId || item.id?.toString() || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Heart size={64} color={theme.primary} fill={theme.card} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {activeTab === 'video' ? 'No Liked Videos' : 'No Liked Audio'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>
              Save your favorite {activeTab}s to listen to them anytime.
            </Text>
          </View>
        }
      />

      <ConfirmationModal 
        visible={showConfirm}
        title={t('removeFavTitle') || 'Remove from Favorites'}
        message={t('removeFavMsg') || 'Do you want to remove this from your divine collection?'}
        confirmText={t('remove') || 'Remove'}
        onConfirm={confirmRemove}
        onCancel={() => setShowConfirm(false)}
        type="danger"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingTop: 16, paddingBottom: 100 },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 5,
    backgroundColor: 'transparent',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
  },
  tabText: {
    fontSize: 11,
    fontFamily: 'Outfit-Black',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  emptyContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 120, 
    paddingHorizontal: 50 
  },
  emptyTitle: { 
    fontSize: 18, 
    fontFamily: 'Outfit-Bold', 
    marginTop: 24,
    textAlign: 'center'
  },
  emptySubtitle: { 
    fontSize: 13, 
    fontFamily: 'Outfit-Medium', 
    textAlign: 'center', 
    marginTop: 10, 
    lineHeight: 20,
    opacity: 0.6
  },
  authPrompt: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  lockCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  authTitle: { fontSize: 24, fontFamily: 'Outfit-Bold', marginBottom: 12 },
  authSubtitle: { fontSize: 16, fontFamily: 'Outfit-Medium', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  loginBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 32, paddingVertical: 18, borderRadius: 20, elevation: 8 },
  loginText: { color: '#FFF', fontSize: 18, fontFamily: 'Outfit-Bold' },
  audioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    marginBottom: 12,
    marginHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  audioThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  audioDetails: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  audioTitle: {
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
    marginBottom: 4,
  },
  audioSubtitle: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    opacity: 0.4,
  },
  audioFavBtn: {
    padding: 10,
  },
});
