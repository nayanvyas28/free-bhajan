import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';
import ScreenWrapper from '../components/ScreenWrapper';
import { getCuratedBhajans } from '../services/youtubeApi';
import { saveFavorite, getFavorites, removeFavorite } from '../storage/favorites';
import { MoreVertical, Music, Heart, Search, X } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { useLanguage } from '../context/LanguageContext';

export default function AudioScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { playVideo, currentVideo } = usePlayer();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favIds, setFavIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSongs, setFilteredSongs] = useState([]);

  useEffect(() => {
    loadSongs();
    loadFavorites();
  }, []);

  const loadSongs = async () => {
    setLoading(true);
    const data = await getCuratedBhajans();
    const filtered = data.filter(item => item.type === 'audio' && item.subType !== 'Aarti');
    setSongs(filtered);
    setFilteredSongs(filtered);
    setLoading(false);
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSongs(songs);
    } else {
      const filtered = songs.filter(item => 
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSongs(filtered);
    }
  }, [searchQuery, songs]);

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

    const title = item.title || item.snippet?.title || 'Untitled';
    const subTitle = item.category || item.snippet?.channelTitle || 'Bhajan';
    const thumb = item.thumbnail || item.snippet?.thumbnails?.high?.url;

    return (
      <TouchableOpacity 
        style={[
          styles.songItem, 
          isPlaying && { backgroundColor: 'rgba(255, 193, 7, 0.08)', borderColor: 'rgba(255, 193, 7, 0.2)' }
        ]}
        onPress={() => playVideo(item, songs)}
      >
        <View style={styles.thumbWrapper}>
          <Image 
            source={{ uri: thumb || 'https://via.placeholder.com/150' }} 
            style={styles.thumbnail} 
          />
          {isPlaying && (
            <View style={styles.playingOverlay}>
              <Music size={20} color={theme.primary} />
            </View>
          )}
        </View>
        
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
            size={22} 
            color={isFav ? "#FF3B30" : theme.subtext} 
            fill={isFav ? "#FF3B30" : "transparent"} 
            strokeWidth={isFav ? 0 : 2}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper hasTabBar={true}>
      <View style={[styles.container]}>
        <Header />
        
        <View style={styles.headerSection}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t('spiritualSongs')}</Text>
          <View style={styles.statsRow}>
            <View style={styles.dot} />
            <Text style={[styles.headerSub, { color: theme.subtext }]}>
              {filteredSongs.length} {filteredSongs.length === 1 ? t('trackFound') : t('tracksFound')}
            </Text>
          </View>
        </View>

        <View style={styles.searchSection}>
          <View style={[styles.searchInputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Search size={20} color={theme.primary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('searchPlaceholder')}
              placeholderTextColor={theme.subtext}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={20} color={theme.subtext} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredSongs}
            renderItem={renderSongItem}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBox}>
                  <Music size={40} color={theme.primary} />
                </View>
                <Text style={[styles.emptyText, { color: theme.subtext }]}>{t('noData')}</Text>
              </View>
            }
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchSection: { paddingHorizontal: 20, paddingBottom: 15 },
  searchInputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 20, 
    paddingHorizontal: 18, 
    height: 60, 
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchIcon: { marginRight: 15 },
  searchInput: { flex: 1, fontSize: 16, fontFamily: 'Outfit-Bold' },
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Outfit-Bold',
    letterSpacing: -0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  headerSub: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    opacity: 0.6,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 150,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  thumbWrapper: {
    position: 'relative',
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
  },
  playingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    opacity: 0.5,
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
    gap: 20,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,193,7,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    opacity: 0.5,
  }
});
