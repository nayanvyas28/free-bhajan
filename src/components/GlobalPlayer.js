import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Dimensions, Animated, BackHandler
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Play, Pause, X, ChevronDown, SkipBack, SkipForward, Music } from 'lucide-react-native';
import YoutubeIframe from 'react-native-youtube-iframe';
import { usePlayer } from '../context/PlayerContext';
import { LinearGradient } from 'expo-linear-gradient';

const { height, width } = Dimensions.get('window');

export default function GlobalPlayer() {
  const {
    currentVideo, isPlaying, pauseVideo, resumeVideo,
    closePlayer, playNext, playPrev, queue, playVideo
  } = usePlayer();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const playerRef = useRef(null);
  const prevVideoId = useRef(null);
  
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Auto-expand when a NEW video is selected
  useEffect(() => {
    if (!currentVideo) {
      Animated.spring(expandAnim, { toValue: 0, useNativeDriver: false, friction: 8 }).start();
      setIsExpanded(false);
      prevVideoId.current = null;
      return;
    }
    const newId = currentVideo?.id?.videoId || currentVideo?.audioUrl;
    if (newId !== prevVideoId.current) {
      prevVideoId.current = newId;
      Animated.spring(expandAnim, { toValue: 1, useNativeDriver: false, friction: 8 }).start();
      setIsExpanded(true);
    }
  }, [currentVideo]);

  // YT → App sync
  const onStateChange = useCallback((state) => {
    if (state === 'playing') {
      setIsBuffering(false);
      if (!isPlayingRef.current) resumeVideo();
    } else if (state === 'paused') {
      setIsBuffering(false);
      if (isPlayingRef.current) pauseVideo();
    } else if (state === 'buffering') {
      setIsBuffering(true);
    } else if (state === 'ended') {
      setIsBuffering(false);
      playNext();
    }
  }, [resumeVideo, pauseVideo, playNext]);

  // App → YT sync
  const handleMiniPlayPause = useCallback((e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (isPlayingRef.current) {
      pauseVideo();
    } else {
      resumeVideo();
    }
  }, [pauseVideo, resumeVideo]);

  const handleClose = async () => {
    pauseVideo();
    setIsBuffering(false);
    Animated.timing(expandAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false
    }).start();

    setTimeout(() => {
      closePlayer();
    }, 400);
  };

  useEffect(() => {
    const backAction = () => {
      if (isExpanded) { toggleExpand(); return true; }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isExpanded]);

  if (!currentVideo) return null;

  const snippet = currentVideo?.snippet;
  const isYoutube = currentVideo.type === 'youtube';
  const videoId = currentVideo?.id?.videoId;

  const toggleExpand = () => {
    Animated.spring(expandAnim, {
      toValue: isExpanded ? 0 : 1,
      useNativeDriver: false,
      friction: 8,
    }).start();
    setIsExpanded(prev => !prev);
  };

  const containerHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [70, height],
  });

  const bottomPosition = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [85, 0],
  });

  const miniOpacity = expandAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [1, 0, 0],
  });

  const fullOpacity = expandAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.01, 0.01, 1],
  });

  return (
    <Animated.View style={[styles.container, { height: containerHeight, bottom: bottomPosition }]}>

      {/* ── SINGLE YouTube Player ── */}
      {isYoutube && videoId ? (
        <Animated.View
          style={[styles.ytWrapper, {
            opacity: fullOpacity,
            top: 110,
          }]}
          pointerEvents={isExpanded ? 'auto' : 'none'}
        >
          <YoutubeIframe
            key={videoId} // IMPORTANT: Force fresh instance for each video
            ref={playerRef}
            height={width * 0.5625}
            width={width - 40}
            play={isPlaying}
            videoId={videoId}
            onChangeState={onStateChange}
            initialPlayerParams={{
              preventFullScreen: false,
              showClosedCaptions: false,
              controls: 1,
              modestbranding: 1,
              rel: 0,
              autoplay: 1,
            }}
            webViewProps={{
              allowsInlineMediaPlayback: true,
              mediaPlaybackRequiresUserAction: false,
              allowsFullscreenVideo: true,
              javaScriptEnabled: true,
              domStorageEnabled: true,
            }}
            forceAndroidAutoplay={true}
          />
        </Animated.View>
      ) : null}

      {/* ── FULL SCREEN PLAYER ── */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: fullOpacity }]}
        pointerEvents={isExpanded ? 'auto' : 'none'}
      >
        <LinearGradient colors={['#1A1A2E', '#0F0F13']} style={styles.fullScreenBg}>
          <View style={styles.fullHeader}>
            <TouchableOpacity onPress={toggleExpand} style={styles.iconBtn}>
              <ChevronDown color="#FFF" size={28} />
            </TouchableOpacity>
            <Text style={styles.nowPlayingText}>NOW PLAYING</Text>
            <TouchableOpacity onPress={handleClose} style={styles.iconBtn}>
              <X color="#FFF" size={24} />
            </TouchableOpacity>
          </View>

          {/* Artwork / Video slot (the real player goes here when expanded) */}
          <View style={styles.artworkWrapper}>
            {isYoutube ? (
              <View style={styles.ytPlayerSlot} />
            ) : (
              <View style={styles.audioArtwork}>
                <Image
                  source={{ uri: snippet?.thumbnails?.high?.url }}
                  style={styles.audioBg}
                  blurRadius={20}
                />
                <Image
                  source={{ uri: snippet?.thumbnails?.high?.url }}
                  style={styles.audioAlbumArt}
                />
                <View style={styles.audioMusicIcon}>
                  <Music color="#FFB300" size={40} />
                </View>
              </View>
            )}
          </View>

          <View style={styles.fullInfo}>
            <Text style={styles.fullTitle} numberOfLines={2}>{snippet?.title || 'Untitled'}</Text>
            <Text style={styles.fullChannel}>{snippet?.channelTitle || 'Bhajan'}</Text>
          </View>

          {/* ── UP NEXT SECTION (YouTube style) ── */}
          <View style={styles.upNextContainer}>
            <View style={styles.upNextHeader}>
              <Text style={styles.upNextTitle}>UP NEXT</Text>
              <View style={styles.upNextLine} />
            </View>
            <Animated.ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.upNextList}
            >
              {queue && queue
                .filter(item => (item?.id?.videoId || item?.audioUrl) !== (currentVideo?.id?.videoId || currentVideo?.audioUrl)) // Filter out current playing
                .map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.upNextCard}
                  onPress={() => playVideo(item, queue)}
                >
                  <Image 
                    source={{ uri: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url }} 
                    style={styles.upNextThumb}
                  />
                  <View style={styles.upNextCardInfo}>
                    <Text style={styles.upNextCardTitle} numberOfLines={2}>
                      {item.snippet?.title}
                    </Text>
                    <Text style={styles.upNextCardChannel} numberOfLines={1}>
                      {item.snippet?.channelTitle || 'Bhajan'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </Animated.ScrollView>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* ── MINI PLAYER ── */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: miniOpacity }]}
        pointerEvents={isExpanded ? 'none' : 'auto'}
      >
        {/* Poora mini player expand karta hai — sirf text/image area pe tap se */}
        <TouchableOpacity activeOpacity={0.9} onPress={toggleExpand} style={styles.miniContainer}>
          <BlurView intensity={80} tint="dark" style={styles.blurView}>
            <Image
              source={{ uri: snippet?.thumbnails?.high?.url }}
              style={styles.miniThumb}
            />
            <View style={styles.miniTextContainer}>
              <Text style={styles.miniTitle} numberOfLines={1}>{snippet?.title || 'Untitled'}</Text>
              <Text style={styles.miniChannel} numberOfLines={1}>{snippet?.channelTitle || 'Bhajan'}</Text>
            </View>
            {/* Play/Pause — stopPropagation se outer expand trigger nahi hoga */}
            <TouchableOpacity
              onPress={handleMiniPlayPause}
              style={styles.miniPlayBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {isPlaying
                ? <Pause color="#FFB300" size={22} fill="#FFB300" />
                : <Play color="#FFB300" size={22} fill="#FFB300" />}
            </TouchableOpacity>
            {/* Close button */}
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); handleClose(); }}
              style={styles.miniCloseBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X color="#9CA3AF" size={18} />
            </TouchableOpacity>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 8,
    right: 8,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 9999,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  ytWrapper: {
    position: 'absolute',
    alignSelf: 'center',
    left: 20,
    zIndex: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  ytPlayerSlot: {
    width: width - 40,
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 20,
  },
  // ── Full screen ──
  fullScreenBg: { flex: 1 },
  fullHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 55,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  nowPlayingText: {
    color: '#FFB300',
    fontSize: 10,
    fontFamily: 'Outfit-Black',
    letterSpacing: 3,
  },
  iconBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 21,
  },
  artworkWrapper: {
    width: width - 40,
    alignSelf: 'center',
    aspectRatio: 16 / 9,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginTop: 4,
  },
  audioArtwork: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  audioAlbumArt: {
    width: '70%',
    height: '70%',
    borderRadius: 16,
  },
  audioMusicIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
  },
  fullInfo: {
    paddingHorizontal: 32,
    paddingTop: 28,
  },
  fullTitle: {
    color: '#FFF',
    fontSize: 22,
    fontFamily: 'Outfit-Bold',
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  fullChannel: {
    color: '#FFB300',
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
    marginTop: 6,
    opacity: 0.9,
  },
  // ── Up Next Section ──
  upNextContainer: {
    marginTop: 30,
    paddingHorizontal: 24,
    flex: 1, // Allow it to take remaining space
  },
  upNextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  upNextTitle: {
    color: '#FFB300',
    fontSize: 12,
    fontFamily: 'Outfit-Black',
    letterSpacing: 2,
    marginRight: 12,
  },
  upNextLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  upNextList: {
    paddingBottom: 150, // Space for mini player/bottom
  },
  upNextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  activeUpNextCard: {
    borderColor: '#FFB300',
    backgroundColor: 'rgba(255,179,0,0.08)',
  },
  upNextThumb: {
    width: 100,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  upNextCardInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  upNextCardTitle: {
    color: '#E5E7EB',
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    lineHeight: 18,
  },
  upNextCardChannel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
    marginTop: 2,
  },
  // ── Mini player ──
  miniContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  blurView: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: 'rgba(18, 18, 24, 0.85)',
  },
  miniThumb: {
    width: 42,
    height: 42,
    borderRadius: 8,
  },
  miniTextContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  miniTitle: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    letterSpacing: -0.2,
  },
  miniChannel: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'Outfit-Medium',
  },
  miniPlayBtn: {
    padding: 10,
    backgroundColor: 'rgba(255,179,0,0.1)',
    borderRadius: 12,
  },
  miniCloseBtn: {
    padding: 10,
    marginLeft: 2,
  },
});
