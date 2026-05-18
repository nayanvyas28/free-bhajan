import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Share } from 'react-native';
import { Play, Heart, Music, Image as ImageIcon, Share2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';

import { CONFIG } from '../constants/Config';

const VideoCard = ({ video, isFav, onFavorite, onPress }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
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
        message: `🙏 Jai Shree Ram! 🙏\n\nListen to this beautiful Bhajan: "${title}"\n\n🎵 Listen here: ${shareUrl}\n\n📲 Download *${CONFIG.APP_NAME}* app for more Bhajans, Mantras & Panchang:\n${CONFIG.PLAY_STORE_URL}`,
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]} 
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
          <View style={styles.playCircle}>
            {isAudio ? <Music size={28} color="#FFF" /> : <Play size={28} color="#FFF" fill="#FFF" />}
          </View>
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
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderColor: theme.border }]} onPress={onShare}>
            <Share2 size={20} color={theme.subtext} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderColor: theme.border }]} onPress={onFavorite}>
            <Heart 
              size={22} 
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
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  thumbnailContainer: {
    position: 'relative',
    height: 200,
    width: '100%',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '140%',
    position: 'absolute',
    top: 0,
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
    gap: 12,
  },
  fallbackText: {
    color: '#6B7280',
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  playCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  infoContainer: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  subType: {
    fontSize: 9,
    fontFamily: 'Outfit-Black',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  channelTitle: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    marginTop: 4,
    opacity: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  audioBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  audioBadgeText: {
    color: '#FFC107',
    fontSize: 9,
    fontFamily: 'Outfit-Black',
    letterSpacing: 1,
  },
});

export default VideoCard;
