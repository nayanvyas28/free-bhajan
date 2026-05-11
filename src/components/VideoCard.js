import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Share } from 'react-native';
import { Play, Heart, Music, Image as ImageIcon, Share2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const VideoCard = ({ video, isFav, onFavorite, onPress }) => {
  const { theme } = useTheme();
  const [imgError, setImgError] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const isAudio = video.type === 'audio';
  const snippet = video.snippet || {};
  
  // Support both YouTube API and Supabase structures
  const title = video.title || snippet.title || 'Untitled Divine Content';
  const thumbnailUrl = video.image_url || video.thumbnail || snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url;
  const channelTitle = video.channel_title || snippet.channelTitle || 'Bhajan App';
  
  const onShare = async () => {
    try {
      const shareUrl = video.type === 'youtube' ? `https://youtube.com/watch?v=${video.id?.videoId || video.id}` : (video.url || video.audioUrl);
      const result = await Share.share({
        message: `Listen to "${title}" on Mantra Puja App. 🙏\n\n${shareUrl}\n\nDownload Mantra Puja for more Bhajans & Mantras!`,
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]} 
      onPress={onPress} 
      activeOpacity={0.8}
    >
      <View style={styles.thumbnailContainer}>
        {thumbnailUrl && !imgError ? (
          <>
            <Image 
              source={{ uri: thumbnailUrl }} 
              style={[styles.thumbnail, isAudio && { opacity: 0.6 }]} 
              resizeMode="cover"
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                setImgError(true);
                setLoading(false);
              }}
            />
            {loading && (
              <View style={[styles.placeholder, { backgroundColor: theme.card }]}>
                <ActivityIndicator color={theme.primary} />
              </View>
            )}
          </>
        ) : (
          <LinearGradient
            colors={['#1E293B', '#0F172A']}
            style={styles.thumbnail}
          >
            <View style={styles.fallbackContent}>
              <Music color="#FFB300" size={40} opacity={0.5} />
              <Text style={styles.fallbackText}>Image Not Available</Text>
            </View>
          </LinearGradient>
        )}
        
        <View style={styles.playOverlay}>
          {isAudio ? <Music size={24} color="#FFB300" /> : <Play size={24} color="#FFB300" fill="#FFB300" />}
        </View>

        {isAudio && (
          <View style={styles.audioBadge}>
            <Text style={styles.audioBadgeText}>{t('audio').toUpperCase()}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.textContainer}>
          <Text style={[styles.subType, { color: theme.primary }]}>
            {t(video.subType || 'Bhajan')}
          </Text>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={[styles.channelTitle, { color: theme.subtext }]}>
            {channelTitle}
          </Text>
        </View>
        
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={onShare}>
            <Share2 size={22} color={theme.subtext} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={onFavorite}>
            <Heart 
              size={24} 
              color={isFav ? "#FF3B30" : theme.subtext} 
              fill={isFav ? "#FF3B30" : "transparent"} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  thumbnailContainer: {
    position: 'relative',
    height: 180,
    width: '100%',
    overflow: 'hidden', // Crucial to clip the bottom
  },
  thumbnail: {
    width: '100%',
    height: '150%', // Make the image taller than container to allow top-aligning
    position: 'absolute',
    top: 0, // Force top alignment
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  fallbackText: {
    color: '#6B7280',
    fontSize: 10,
    fontFamily: 'Outfit-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  playOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 0, 0.2)',
  },
  infoContainer: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    lineHeight: 22,
  },
  channelTitle: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    padding: 8,
  },
  audioBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255, 179, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFB300',
  },
  audioBadgeText: {
    color: '#FFB300',
    fontSize: 9,
    fontFamily: 'Outfit-Black',
    letterSpacing: 1,
  },
});

export default VideoCard;
