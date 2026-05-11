import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { getFavorites, removeFavorite } from '../storage/favorites';
import VideoCard from '../components/VideoCard';
import Header from '../components/Header';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Heart, Lock, LogIn, Video, Music, Sparkles } from 'lucide-react-native';
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

  const filteredData = favorites.filter(item => {
    const isSol = item.is_solution || !!item.image_url;
    
    if (activeTab === 'u_video') return isSol && item.type === 'video';
    if (activeTab === 'u_audio') return isSol && item.type === 'audio';
    
    if (activeTab === 'video') {
      return !isSol && (item.type === 'youtube' || item.type === 'video' || !item.type);
    }
    if (activeTab === 'audio') {
      return !isSol && item.type === 'audio';
    }
    return false;
  });

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
    // Audio items (both Bhajan and Upaye) use the compact horizontal style
    if (activeTab === 'audio' || activeTab === 'u_audio') {
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
              {item.is_solution ? t(item.category) : (item.category || item.snippet?.channelTitle || 'Bhajan')}
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

    // Video items (both Bhajan and Upaye) use the large VideoCard style
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
      <Header />

      <View style={styles.headerArea}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('favorites')}</Text>
      </View>

      <View style={styles.tabScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContainer}>
          {[
            { id: 'video', label: t('bhajanVideo'), icon: Video },
            { id: 'audio', label: t('bhajanAudio'), icon: Music },
            { id: 'u_video', label: t('upayeVideo'), icon: Sparkles },
            { id: 'u_audio', label: t('upayeAudio'), icon: Music }
          ].map(tab => (
            <TouchableOpacity 
              key={tab.id}
              style={[
                styles.tab, 
                { backgroundColor: theme.surface, borderColor: 'rgba(255,255,255,0.05)' },
                activeTab === tab.id && { backgroundColor: 'rgba(255,193,7,0.1)', borderColor: theme.primary }
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <tab.icon 
                size={18} 
                color={activeTab === tab.id ? theme.primary : theme.subtext} 
              />
              <Text style={[
                styles.tabText, 
                { color: activeTab === tab.id ? theme.primary : theme.subtext }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id?.videoId || item.id?.toString() || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Heart size={40} color={theme.primary} fill={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {t('noLikedItems')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>
              {t('saveFavoriteDivine')}
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
  headerArea: { paddingHorizontal: 24, paddingTop: 20 },
  headerTitle: { fontSize: 28, fontFamily: 'Outfit-Bold' },
  listContent: { paddingTop: 16, paddingBottom: 150 },
  tabScrollWrapper: { marginTop: 15, marginBottom: 10 },
  tabContainer: {
    paddingHorizontal: 20,
    gap: 12,
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
  },
  tabText: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    letterSpacing: 0.5,
  },
  emptyContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 100, 
    paddingHorizontal: 50 
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,193,7,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: { 
    fontSize: 20, 
    fontFamily: 'Outfit-Bold', 
    textAlign: 'center'
  },
  emptySubtitle: { 
    fontSize: 14, 
    fontFamily: 'Outfit-Medium', 
    textAlign: 'center', 
    marginTop: 10, 
    lineHeight: 22,
    opacity: 0.5
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
    padding: 14,
    borderRadius: 24,
    marginBottom: 16,
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  audioThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#1A1A1A',
  },
  audioDetails: {
    flex: 1,
    marginLeft: 18,
    justifyContent: 'center',
  },
  audioTitle: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    marginBottom: 4,
  },
  audioSubtitle: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    opacity: 0.5,
  },
  audioFavBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
