import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';
import { getCuratedBhajans } from '../services/youtubeApi';
import { saveFavorite, getFavorites, removeFavorite } from '../storage/favorites';
import { MoreVertical, Music, Heart } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { useLanguage } from '../context/LanguageContext';

export default function AudioScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { playVideo, currentVideo } = usePlayer();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favIds, setFavIds] = useState([]);

  useEffect(() => {
    loadSongs();
    loadFavorites();
  }, []);

  const loadSongs = async () => {
    setLoading(true);
    const data = await getCuratedBhajans();
    // Only show items that are explicitly of type 'audio'
    const filtered = data.filter(item => item.type === 'audio');
    setSongs(filtered);
    setLoading(false);
  };

  const loadFavorites = async () => {
    const favs = await getFavorites();
    setFavIds(favs.map(f => f.id.videoId || f.id));
  };

  const toggleFavorite = async (video) => {
    const videoId = video.id.videoId || video.id;
    if (favIds.includes(videoId)) {
      Alert.alert(
        t('removeFavoriteTitle') || 'Remove Favorite',
        t('removeFavoriteMessage') || 'Are you sure you want to remove this from your favorites?',
        [
          { text: t('cancel') || 'Cancel', style: 'cancel' },
          { 
            text: t('remove') || 'Remove', 
            style: 'destructive',
            onPress: async () => {
              await removeFavorite(videoId);
              setFavIds(favIds.filter(id => id !== videoId));
            }
          }
        ]
      );
    } else {
      await saveFavorite(video);
      setFavIds([...favIds, videoId]);
    }
  };

  const renderSongItem = ({ item }) => {
    const videoId = item.id?.videoId || item.id;
    const isPlaying = (currentVideo?.id?.videoId || currentVideo?.id) === videoId;
    const isFav = favIds.includes(videoId);

    // Support both Cloudflare and YouTube formats
    const title = item.title || item.snippet?.title || 'Untitled';
    const subTitle = item.category || item.snippet?.channelTitle || 'Bhajan';
    const thumb = item.thumbnail || item.snippet?.thumbnails?.high?.url;

    return (
      <TouchableOpacity 
        style={styles.songItem}
        onPress={() => playVideo(item, songs)}
      >
        <Image 
          source={{ uri: thumb || 'https://via.placeholder.com/150' }} 
          style={styles.thumbnail} 
        />
        
        <View style={styles.details}>
          <Text 
            style={[styles.title, { color: isPlaying ? theme.primary : theme.text }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]} numberOfLines={1}>
            {subTitle}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.favBtn} 
          onPress={() => toggleFavorite(item)}
        >
          <Heart 
            size={20} 
            color={isFav ? "#FF3B30" : theme.subtext} 
            fill={isFav ? "#FF3B30" : "transparent"} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title={t('music')} />
      
      <View style={styles.headerSection}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('spiritualSongs') || 'Spiritual Songs'}</Text>
        <Text style={[styles.headerSub, { color: theme.subtext }]}>
          {songs.length} {songs.length === 1 ? (t('trackFound') || 'Track Found') : (t('tracksFound') || 'Tracks Found')}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={songs}
          renderItem={renderSongItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Music size={48} color={theme.border} />
              <Text style={[styles.emptyText, { color: theme.subtext }]}>{t('noData')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 12,
    fontFamily: 'Outfit-Black',
    textTransform: 'uppercase',
    letterSpacing: 2,
    opacity: 0.8,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
    marginTop: 4,
    opacity: 0.6,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    paddingTop: 15,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  details: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    opacity: 0.4,
  },
  favBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Outfit-Medium',
  }
});
