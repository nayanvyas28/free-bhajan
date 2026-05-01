import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';
import { getCuratedBhajans } from '../services/youtubeApi';
import { MoreVertical, Music } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';

export default function AudioScreen() {
  const { theme } = useTheme();
  const { playVideo, currentVideo } = usePlayer();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    setLoading(true);
    const data = await getCuratedBhajans();
    // Only show items that are explicitly of type 'audio'
    const filtered = data.filter(item => item.type === 'audio');
    setSongs(filtered);
    setLoading(false);
  };

  const renderSongItem = ({ item }) => {
    const isPlaying = currentVideo?.id === item.id.videoId;

    return (
      <TouchableOpacity 
        style={styles.songItem}
        onPress={() => playVideo({
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.high.url
        })}
      >
        <Image 
          source={{ uri: item.snippet.thumbnails.high.url }} 
          style={styles.thumbnail} 
        />
        
        <View style={styles.details}>
          <Text 
            style={[styles.title, { color: isPlaying ? theme.primary : theme.text }]}
            numberOfLines={1}
          >
            {item.snippet.title}
          </Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]} numberOfLines={1}>
            {item.snippet.channelTitle}
          </Text>
        </View>

        <TouchableOpacity style={styles.moreBtn}>
          <MoreVertical size={20} color={theme.subtext} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Mantra Puja Music" />
      
      <View style={styles.headerSection}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Spiritual Songs</Text>
        <Text style={[styles.headerSub, { color: theme.subtext }]}>{songs.length} Tracks found</Text>
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
              <Text style={[styles.emptyText, { color: theme.subtext }]}>No songs found.</Text>
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
    fontSize: 22,
    fontFamily: 'Outfit-Bold',
  },
  headerSub: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    opacity: 0.7,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 6,
    backgroundColor: '#1E293B',
  },
  details: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
  },
  moreBtn: {
    padding: 4,
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
