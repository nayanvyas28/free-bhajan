import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Dimensions, Animated, ActivityIndicator, PanResponder, Share
} from 'react-native';
import { Play, Pause, X, ChevronDown, SkipBack, SkipForward, List, BookOpen, Music, Plus, Minus, Type, Maximize, Share2, Shuffle, Repeat, Heart } from 'lucide-react-native';
import { CONFIG } from '../constants/Config';
import { useVideoPlayer, VideoView } from 'expo-video';
import YoutubeIframe from 'react-native-youtube-iframe';
import { usePlayer } from '../context/PlayerContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView } from 'react-native';

const { height, width } = Dimensions.get('window');

export default function GlobalPlayer() {
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { 
    currentVideo, 
    isPlaying, 
    pauseVideo, 
    resumeVideo, 
    closePlayer, 
    playNext, 
    playPrev, 
    queue, 
    playVideo,
    isShuffle,
    isRepeat,
    toggleShuffle,
    toggleRepeat,
    favIds,
    toggleFavorite
  } = usePlayer();

  const isFav = currentVideo && favIds.includes(currentVideo.id?.videoId || currentVideo.id);

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [lyricsFontSize, setLyricsFontSize] = useState(16);
  const [isBuffering, setIsBuffering] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  // Removed local isRepeat/isShuffle states as they are now in context
  const expandAnim = useRef(new Animated.Value(0)).current;
  const prevUrlRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);
  const ytPlayerRef = useRef(null);
  const videoViewRef = useRef(null);
  const lyricsScrollRef = useRef(null);
  const [lyricsContentHeight, setLyricsContentHeight] = useState(0);
  const [lyricsViewHeight, setLyricsViewHeight] = useState(0);

  // Smart Parser for Lyrics (Handles JSON or Human-friendly format)
  const parsedLyrics = (() => {
    try {
      const rawLyrics = currentVideo?.lyrics;
      if (!rawLyrics || typeof rawLyrics !== 'string') return null;

      // 1. Handle JSON format (existing)
      if (rawLyrics.trim().startsWith('[')) {
        return JSON.parse(rawLyrics);
      }

      // 2. Handle Human-friendly format (00:00:03 \n Jay Ambe...)
      const lines = rawLyrics.split('\n');
      const synced = [];
      let currentEntry = null;

      const timeRegex = /(\d{1,2}):(\d{1,2}):(\d{1,2})|(\d{1,2}):(\d{1,2})/;

      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        const timeMatch = trimmed.match(timeRegex);
        if (timeMatch) {
          // It's a timestamp
          let seconds = 0;
          if (timeMatch[1] !== undefined) {
            // HH:MM:SS
            seconds = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]);
          } else {
            // MM:SS
            seconds = parseInt(timeMatch[4]) * 60 + parseInt(timeMatch[5]);
          }
          
          currentEntry = { time: seconds, text: '' };
          synced.push(currentEntry);
        } else if (currentEntry) {
          // It's text for the current timestamp - Filter out square brackets [...]
          const cleanText = trimmed.replace(/\[.*?\]/g, '').trim();
          if (cleanText) {
            currentEntry.text = currentEntry.text ? `${currentEntry.text}\n${cleanText}` : cleanText;
          }
        }
      });

      return synced.length > 0 ? synced : null;
    } catch (e) {
      console.log("Lyrics Parse Error:", e);
      return null;
    }
  })();

  const lineLayouts = useRef({});

  // Sync active lyric index
  useEffect(() => {
    if (parsedLyrics && isPlaying) {
      const index = parsedLyrics.findLastIndex(l => position >= l.time);
      if (index !== activeLyricIndex) {
        setActiveLyricIndex(index);
        
        // Auto-scroll logic (Using Dynamic Layouts for Perfect Centering)
        if (autoScroll && lyricsScrollRef.current && index !== -1 && lineLayouts.current[index]) {
          const layout = lineLayouts.current[index];
          const vHeight = lyricsViewHeight || (width - 150);
          
          // Scroll so the CENTER of the item is at the CENTER of the viewport
          const scrollY = layout.y - (vHeight / 2) + (layout.height / 2);
          
          lyricsScrollRef.current.scrollTo({ y: Math.max(0, scrollY), animated: true });
        }
      }
    }
  }, [position, parsedLyrics, autoScroll, isPlaying, lyricsViewHeight]);

  // Resume auto-scroll after manual interaction
  const scrollTimeout = useRef(null);
  const handleLyricsScrollStart = () => {
    setAutoScroll(false);
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => setAutoScroll(true), 3000);
  };

  // Auto-scroll effect for plain text
  useEffect(() => {
    if (!parsedLyrics && autoScroll && isPlaying && lyricsScrollRef.current && duration > 0 && lyricsContentHeight > lyricsViewHeight) {
      const scrollableHeight = lyricsContentHeight - lyricsViewHeight;
      const scrollY = (position / duration) * scrollableHeight;
      lyricsScrollRef.current.scrollTo({ y: scrollY, animated: true });
    }
  }, [position, duration, autoScroll, isPlaying, lyricsContentHeight, lyricsViewHeight, parsedLyrics]);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // 1. DYNAMIC URL EXTRACTION
  const getDirectUrl = () => {
    if (!currentVideo) return null;
    const url = currentVideo.url || 
                currentVideo.audioUrl || 
                currentVideo.video_url || 
                currentVideo.audio_url || 
                currentVideo.uri ||
                (currentVideo.id && typeof currentVideo.id === 'string' && currentVideo.id.startsWith('http') ? currentVideo.id : 
                 (currentVideo.id?.videoId && typeof currentVideo.id.videoId === 'string' && currentVideo.id.videoId.startsWith('http') ? currentVideo.id.videoId : null));
    
    return typeof url === 'string' ? url.trim() : url;
  };

  const directUrl = getDirectUrl();

  // 2. DETECTION
  const isCloudflare = directUrl?.includes('r2.dev') || directUrl?.includes('cloudflarestorage.com');
  const isSupabase = directUrl?.includes('supabase.co') || directUrl?.includes('mpbucket');
  const isMediaFile = directUrl && (isCloudflare || isSupabase || directUrl.toLowerCase().match(/\.(mp4|mp3|m4a|mpeg|wav|mov)$/));
  const isYoutubeUrl = directUrl?.includes('youtube.com') || directUrl?.includes('youtu.be') || (directUrl && directUrl.length === 11);
  const isYoutube = isYoutubeUrl || (!isMediaFile && (currentVideo?.type === 'youtube' || (currentVideo?.id?.videoId && !directUrl)));

  const isAudioMode = (currentVideo?.type === 'audio' || directUrl?.toLowerCase().includes('audio'));

  // 3. EXPO-VIDEO PLAYER
  const player = useVideoPlayer(null, (p) => {
    p.loop = false;
    p.staysActiveInBackground = true;
    p.showNowPlayingControls = true; // Explicitly enable system controls
    p.autoplay = isPlayingRef.current;
  });

  // 4. SYNC SOURCE
  useEffect(() => {
    if (!player || isYoutube || !directUrl) return;
    if (directUrl === prevUrlRef.current) return;
    prevUrlRef.current = directUrl;
    
    setIsBuffering(true);
    setDuration(currentVideo?.duration || 0);
    setPosition(0);
    setShowControls(true);

    const urlWithBust = directUrl; 
    player.replace({
      uri: urlWithBust,
      metadata: {
        title: currentVideo?.title || 'MantraPuja Bhajan',
        artist: currentVideo?.category || 'Divine Collection',
        artwork: currentVideo?.thumbnail || 'https://mpbucket.pages.dev/assets/logo.png', // Fallback logo
      }
    });
    
    player.staysActiveInBackground = true;
    if (isPlayingRef.current) player.play();
  }, [directUrl, isYoutube, player]);

  // 5. MANUAL METADATA PROBE (For Real-Time Duration)
  const probeDuration = async (url) => {
    if (!url || isYoutube) return;
    try {
      // Try to get headers first
      const headResponse = await fetch(url, { method: 'HEAD' });
      const contentLength = headResponse.headers.get('content-length');
      
      // Probe the first 128KB for metadata
      const response = await fetch(url, { headers: { Range: 'bytes=0-131072' } });
      const buffer = await response.arrayBuffer();
      const view = new DataView(buffer);
      
      for (let i = 0; i < view.byteLength - 20; i++) {
        // Look for 'mvhd' box in MP4
        if (view.getUint32(i) === 0x6D766864) { 
          const version = view.getUint8(i + 4);
          let timescale, durationVal;
          if (version === 0) {
            timescale = view.getUint32(i + 12);
            durationVal = view.getUint32(i + 16);
          } else {
            timescale = view.getUint32(i + 20);
            durationVal = view.getUint32(i + 24);
          }
          if (timescale > 0 && durationVal > 0) {
            const realDur = durationVal / timescale;
            if (realDur > 1) {
              setDuration(realDur);
              return;
            }
          }
        }
      }
    } catch (e) {
      console.log("Metadata probe failed:", e);
    }
  };

  const playerRef = useRef(player);
  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  // Sync expo-video loop with context state
  useEffect(() => {
    if (player) {
      player.loop = isRepeat;
    }
  }, [isRepeat, player]);

  // 6. STATUS LISTENERS & TIME SYNC (EXPO-VIDEO)
  useEffect(() => {
    if (!player || isYoutube) return;
    if (isCloudflare || isSupabase) probeDuration(directUrl);
    
    let isEffectActive = true;
    let statusSub, durSub, timeSub;

    try {
      statusSub = player.addListener('statusChange', (status) => {
        if (!isEffectActive) return;
        setIsBuffering(status === 'loading' || status === 'buffering');
        try {
          const d = player.duration || (player.currentItem && player.currentItem.duration) || 0;
          if (d > 0) setDuration(d);
        } catch (e) {}
      });

      durSub = player.addListener('durationChange', (newDur) => {
        if (!isEffectActive) return;
        if (newDur > 0) setDuration(newDur);
      });

      timeSub = player.addListener('timeUpdate', (event) => {
        if (!isEffectActive) return;
        if (!isDraggingRef.current && !isSeekingRef.current) {
          const curTime = event.currentTime || 0;
          if (curTime >= 0) setPosition(curTime);
        }
      });
    } catch (e) {
      console.warn("[Player] Subscriptions failed:", e.message);
    }

    const interval = setInterval(() => {
      if (!isEffectActive || !playerRef.current) return;
      try {
        if (!isYoutube && !isDraggingRef.current && !isSeekingRef.current) {
          // 1. Position Sync
          const curTime = playerRef.current.currentTime || 0;
          if (curTime >= 0) setPosition(curTime);
          
          // 2. Duration Sync (Multi-source fallback)
          const pDur = playerRef.current.duration;
          const ciDur = playerRef.current.currentItem?.duration;
          const dbDur = currentVideo?.duration;
          
          const totalTime = (pDur > 0) ? pDur : ((ciDur > 0) ? ciDur : (dbDur > 0 ? dbDur : 0));
          
          if (totalTime > 0) {
            setDuration(totalTime);
          }
        }
      } catch (err) {
        // Silent fail for released objects
      }
    }, 500); 

    return () => {
      isEffectActive = false;
      try {
        statusSub?.remove();
        durSub?.remove();
        timeSub?.remove();
      } catch (e) {}
      clearInterval(interval);
    };
  }, [player, isYoutube, directUrl, currentVideo]); // Added currentVideo to dependency to refresh on data changes

  const isUpdatingFromPlayer = useRef(false);

  // Sync Video Player state back to App Context
  useEffect(() => {
    if (!player || isYoutube) return;
    
    const sub = player.addListener('playingChange', (p) => {
      if (isUpdatingFromPlayer.current) return;
      if (p) {
        if (!isPlayingRef.current) resumeVideo();
      } else {
        if (isPlayingRef.current) pauseVideo();
      }
    });
    
    return () => sub.remove();
  }, [player, isYoutube, resumeVideo, pauseVideo]);

  // Sync App Context state TO Video Player
  useEffect(() => {
    if (!player || isYoutube) return;
    isUpdatingFromPlayer.current = true;
    if (isPlaying) {
      player.play();
    } else {
      player.pause();
    }
    // Release the lock after a short delay
    setTimeout(() => { isUpdatingFromPlayer.current = false; }, 100);
  }, [isPlaying, isYoutube, player]);

  // YouTube Time Sync
  useEffect(() => {
    if (!isYoutube) return;
    const interval = setInterval(async () => {
      if (ytPlayerRef.current && !isDraggingRef.current && !isSeekingRef.current) {
        try {
          const t = await ytPlayerRef.current.getCurrentTime();
          const d = await ytPlayerRef.current.getDuration();
          if (t !== undefined) setPosition(t);
          if (d !== undefined && d > 0) setDuration(d);
        } catch (e) {}
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isYoutube]);

  // 6. UI ANIMATION & HELPERS
  useEffect(() => {
    if (!currentVideo) {
      Animated.spring(expandAnim, { toValue: 0, useNativeDriver: false }).start();
      setIsExpanded(false);
      return;
    }
    Animated.spring(expandAnim, { toValue: 1, useNativeDriver: false }).start();
    setIsExpanded(true);
  }, [currentVideo]);

  const toggleExpand = () => {
    const next = !isExpanded;
    Animated.spring(expandAnim, { toValue: next ? 1 : 0, useNativeDriver: false }).start();
    setIsExpanded(next);
  };

  const handleClose = () => {
    pauseVideo();
    Animated.timing(expandAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
    setTimeout(() => closePlayer(), 400);
  };

  const seek = (seconds) => {
    if (isYoutube) {
      ytPlayerRef.current?.seekTo(position + seconds, true);
    } else if (player) {
      player.currentTime = position + seconds;
    }
  };

  const handleVideoTouch = () => {
    setShowControls(true);
    // Hide controls after 3 seconds of inactivity
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
  };

  const controlsTimeout = useRef(null);
  const [barWidth, setBarWidth] = useState(Dimensions.get('window').width - 40);
  const [barX, setBarX] = useState(20);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);

  const isYoutubeRef = useRef(isYoutube);
  const durationRef = useRef(duration);
  const barWidthRef = useRef(barWidth);
  const barXRef = useRef(barX);
  const isDraggingRef = useRef(false);
  const isSeekingRef = useRef(false);

  useEffect(() => { isYoutubeRef.current = isYoutube; }, [isYoutube]);
  useEffect(() => { durationRef.current = duration; }, [duration]);
  
  const updateBarWidth = (w) => {
    setBarWidth(w);
    barWidthRef.current = w;
  };

  const updateBarX = (x) => {
    setBarX(x);
    barXRef.current = x;
  };

  // Unified Duration Logic - Move above PanResponder
  const getEffectiveDuration = () => {
    const pDur = (player && player.duration > 0) ? player.duration : 
                ((player && player.currentItem && player.currentItem.duration > 0) ? player.currentItem.duration : 0);
    const dbDur = currentVideo?.duration || 0;
    return pDur > 0 ? pDur : (dbDur > 0 ? dbDur : duration);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const dur = getEffectiveDuration();
        if (dur <= 0 && !isYoutubeRef.current) return;
        
        isDraggingRef.current = true;
        setIsDragging(true);
        
        // Accurate bar positioning
        const bWidth = barWidthRef.current || 1;
        const touchX = evt.nativeEvent.pageX;
        // Estimate bar start based on screen padding (usually 24 or 30)
        const estimatedBarX = isYoutubeRef.current ? 24 : 30; 
        updateBarX(evt.nativeEvent.pageX - evt.nativeEvent.locationX);

        if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      },
      onPanResponderMove: (evt, gestureState) => {
        const dur = getEffectiveDuration();
        if (dur <= 0 && !isYoutubeRef.current) return;
        
        const touchX = gestureState.moveX || evt.nativeEvent.pageX;
        const bWidth = barWidthRef.current || 1;
        const bX = barXRef.current || 0;
        
        let newPct = (touchX - bX) / bWidth;
        newPct = Math.min(Math.max(newPct, 0), 1);
        setDragProgress(newPct * 100);
        
        // Update local position so time display changes while dragging
        const tempPosition = Math.floor(newPct * dur);
        setPosition(tempPosition);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const dur = getEffectiveDuration();
        if (dur <= 0 && !isYoutubeRef.current) return;
        
        isDraggingRef.current = false;
        setIsDragging(false);
        
        const touchX = gestureState.moveX || evt.nativeEvent.pageX;
        const bWidth = barWidthRef.current || 1;
        const bX = barXRef.current || 0;
        
        let newPct = (touchX - bX) / bWidth;
        newPct = Math.min(Math.max(newPct, 0), 1);
        const newPosition = Math.floor(newPct * dur);
        
        isSeekingRef.current = true;
        setPosition(newPosition);
        
        if (isYoutubeRef.current) {
          ytPlayerRef.current?.seekTo(newPosition, true);
        } else if (player) {
          try {
            player.currentTime = newPosition;
            player.play();
          } catch (e) {
            console.log("Seek error:", e);
          }
        }
        
        resumeVideo();
        setTimeout(() => { isSeekingRef.current = false; }, 1000); 
        handleVideoTouch(); // Refresh controls timeout
      }
    })
  );

  const formatTime = (secs) => {
    if (!secs || isNaN(secs) || secs < 0) return '0:00';
    if (secs > 1000000) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!currentVideo) return null;

  const liveDuration = getEffectiveDuration();
  const isUnknownDuration = liveDuration <= 0;
  const rawProgressPct = (liveDuration > 0) ? (position / liveDuration) * 100 : 0;
  const currentPct = Math.min(Math.max(rawProgressPct, 0), 100);
  const progressPct = isDragging ? dragProgress : currentPct;
  
  const displayDuration = (liveDuration > 0) ? formatTime(liveDuration) : '...';

  const thumbnail = currentVideo?.thumbnail || currentVideo?.image_url || currentVideo?.snippet?.thumbnails?.high?.url;
  const title = currentVideo?.title || currentVideo?.snippet?.title || 'Divine Bhajan';
  const category = (() => {
    const rawSubType = currentVideo?.subType || currentVideo?.sub_type;
    const rawCategory = currentVideo?.category;
    
    // 1. Explicit Sub-Type from DB (Mantra, Katha, Bhajan)
    if (rawSubType && rawSubType !== 'Bhajan') return rawSubType.toUpperCase();
    
    // 2. Detect from Title
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('katha') || lowerTitle.includes('कथा')) return t('katha').toUpperCase();
    if (lowerTitle.includes('mantra') || lowerTitle.includes('मंत्र')) return t('mantra').toUpperCase();
    if (lowerTitle.includes('aarti') || lowerTitle.includes('आरती')) return 'AARTI';
    
    // 3. Fallback to Category Name if it's not generic 'Bhajan'
    if (rawCategory && rawCategory !== 'Bhajan' && rawCategory !== 'All') return rawCategory.toUpperCase();
    
    // 4. Ultimate Fallback
    return t('bhajan').toUpperCase();
  })();

  const currentIdxInQueue = queue.findIndex(v => (v.id?.videoId || v.id) === (currentVideo.id?.videoId || currentVideo.id));
  const upNext = (currentIdxInQueue !== -1) 
    ? queue.slice(currentIdxInQueue + 1, currentIdxInQueue + 11) 
    : queue.filter(v => (v.id?.videoId || v.id) !== (currentVideo.id?.videoId || currentVideo.id)).slice(0, 10);

  return (
    <Animated.View style={[styles.container, {
      height: expandAnim.interpolate({ inputRange: [0, 1], outputRange: [70, height] }),
      bottom: expandAnim.interpolate({ inputRange: [0, 1], outputRange: [85, 0] }),
      borderRadius: expandAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] })
    }]}>
      <LinearGradient colors={isDarkMode ? ['#0F172A', '#020617'] : ['#FFFBF5', '#FFF0E0']} style={StyleSheet.absoluteFill}>
        
        <Animated.View style={{ flex: 1, opacity: expandAnim }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={toggleExpand} style={styles.headerBtn}>
              <ChevronDown color={theme.text} size={30} />
            </TouchableOpacity>
            <Text style={[styles.headerTtl, { color: theme.text }]}>{isAudioMode ? t('nowPlaying') : t('watching')}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.headerBtn}>
              <X color={theme.text} size={26} />
            </TouchableOpacity>
          </View>

          {isAudioMode ? (
            <View style={styles.audioContainer}>
              {/* Hidden VideoView to keep notification session active on Android */}
              {!isYoutube && (
                <VideoView 
                  player={player} 
                  style={{ width: 1, height: 1, position: 'absolute', opacity: 0 }} 
                  nativeControls={false}
                />
              )}
              <View style={styles.sliderWrapper}>
                <ScrollView 
                  horizontal 
                  pagingEnabled 
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => {
                    const slide = Math.round(e.nativeEvent.contentOffset.x / (width - 40));
                    setActiveSlide(slide);
                  }}
                  style={styles.artworkSlider}
                >
                  <View style={styles.slideItem}>
                    <View style={[styles.artworkContainer, { shadowColor: theme.primary }]}>
                      {thumbnail ? <Image source={{ uri: thumbnail }} style={styles.artwork} /> : 
                      <LinearGradient colors={[theme.primary, '#000']} style={styles.artwork}><Text style={{ fontSize: 80 }}>🎵</Text></LinearGradient>}
                    </View>
                  </View>

                  <View style={styles.slideItem}>
                    <View style={[styles.lyricsSlideContainer, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}>
                      <View style={styles.lyricsSlideHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                          <BookOpen size={20} color={theme.primary} />
                          <Text style={[styles.lyricsSlideTitle, { color: theme.text }]}>{t('lyrics')}</Text>
                        </View>
                        <TouchableOpacity 
                          onPress={() => setAutoScroll(!autoScroll)}
                          style={[styles.autoScrollToggle, { backgroundColor: autoScroll ? theme.primary + '20' : 'rgba(255,255,255,0.05)', borderColor: autoScroll ? theme.primary : 'transparent' }]}
                        >
                          <Text style={{ fontSize: 10, fontFamily: 'Outfit-Bold', color: autoScroll ? theme.primary : theme.subtext }}>AUTO</Text>
                        </TouchableOpacity>
                        <View style={styles.fontSizeCtrls}>
                          <TouchableOpacity 
                            onPress={() => setLyricsFontSize(prev => Math.max(12, prev - 2))} 
                            style={[styles.fontSizeBtn, { backgroundColor: 'rgba(255,255,255,0.05)' }]}
                          >
                            <Minus size={14} color={theme.text} />
                          </TouchableOpacity>
                          <Type size={16} color={theme.primary} />
                          <TouchableOpacity 
                            onPress={() => setLyricsFontSize(prev => Math.min(32, prev + 2))} 
                            style={[styles.fontSizeBtn, { backgroundColor: 'rgba(255,255,255,0.05)' }]}
                          >
                            <Plus size={14} color={theme.text} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <ScrollView 
                        ref={lyricsScrollRef}
                        showsVerticalScrollIndicator={false} 
                        onLayout={(e) => setLyricsViewHeight(e.nativeEvent.layout.height)}
                        contentContainerStyle={[styles.lyricsSlideContent, { paddingVertical: lyricsViewHeight / 2 - 50 }]}
                        onContentSizeChange={(w, h) => setLyricsContentHeight(h)}
                        onScrollBeginDrag={handleLyricsScrollStart}
                      >
                        {parsedLyrics ? (
                          parsedLyrics.map((line, idx) => {
                            const isActive = idx === activeLyricIndex;
                            return (
                              <View 
                                key={idx} 
                                onLayout={(e) => {
                                  if (!lineLayouts.current) lineLayouts.current = {};
                                  lineLayouts.current[idx] = e.nativeEvent.layout;
                                }}
                                style={[
                                  styles.lyricLine, 
                                  isActive && { backgroundColor: isDarkMode ? 'rgba(255,193,7,0.15)' : 'rgba(255,143,0,0.1)' }
                                ]}
                              >
                                <Text style={[
                                  styles.lyricsSlideText, 
                                  { 
                                    color: isActive ? theme.primary : (isDarkMode ? '#FFFFFF' : '#000000'), 
                                    fontSize: isActive ? lyricsFontSize + 2 : lyricsFontSize, 
                                    opacity: isActive ? 1 : 0.6,
                                    textAlign: 'center',
                                    lineHeight: lyricsFontSize * 1.5,
                                    fontFamily: isActive ? 'Outfit-Bold' : 'Outfit-Medium'
                                  }
                                ]}>
                                  {line.text}
                                </Text>
                              </View>
                            );
                          })
                        ) : (
                          <Text style={[styles.lyricsSlideText, { color: theme.text, fontSize: lyricsFontSize }]}>
                            {currentVideo?.lyrics || currentVideo?.description || currentVideo?.snippet?.description || `Lyrics not available for this ${category.toLowerCase() || 'song'}.`}
                          </Text>
                        )}
                      </ScrollView>
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.pagination}>
                  {[0, 1].map((i) => (
                    <View 
                      key={i} 
                      style={[
                        styles.dot, 
                        { backgroundColor: activeSlide === i ? theme.primary : 'rgba(255,255,255,0.2)' },
                        activeSlide === i && { width: 16 }
                      ]} 
                    />
                  ))}
                </View>
              </View>

              <View style={styles.audioInfoArea}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.spotifyTtl, { color: theme.text }]} numberOfLines={1}>{title}</Text>
                  <Text style={[styles.spotifySub, { color: theme.primary }]}>{category}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity 
                    onPress={async () => {
                      try {
                        const shareUrl = isYoutube ? `https://youtube.com/watch?v=${currentVideo.id?.videoId || currentVideo.id}` : (currentVideo.url || currentVideo.audioUrl);
                        await Share.share({
                          message: `🙏 Jai Shree Ram! 🙏\n\nListen to "${title}"\n\n🎵 Listen here: ${shareUrl}\n\n📲 Download *${CONFIG.APP_NAME}* for more:\n${CONFIG.PLAY_STORE_URL}`,
                        });
                      } catch (e) {}
                    }}
                    style={styles.actionCircle}
                  >
                    <Share2 size={22} color={theme.text} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => toggleFavorite(currentVideo)} style={styles.actionCircle}>
                    <Heart size={22} color={isFav ? '#FF3B30' : theme.text} fill={isFav ? '#FF3B30' : 'transparent'} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.spotifyProgArea}>
                <View 
                  {...panResponder.current.panHandlers}
                  onLayout={(e) => updateBarWidth(e.nativeEvent.layout.width)}
                  style={styles.progressBarTouchable}
                >
                  <View style={styles.progBg}>
                    <View style={[styles.progFill, { width: `${progressPct}%`, backgroundColor: theme.primary }]} />
                    <View style={[styles.progHandle, { left: `${progressPct}%`, backgroundColor: theme.primary }]} />
                  </View>
                </View>
                <View style={styles.timeRow}>
                  <Text style={styles.timeT}>{formatTime(position)}</Text>
                  <Text style={styles.timeT}>{displayDuration}</Text>
                </View>
              </View>

              <View style={styles.spotifyCtrlRow}>
                <TouchableOpacity onPress={toggleShuffle} style={styles.sideBtn}>
                  <Shuffle size={26} color={isShuffle ? theme.primary : (isDarkMode ? '#666' : '#999')} />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={playPrev} style={styles.sideBtn}>
                  <SkipBack size={32} color={theme.text} fill={theme.text} />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={isPlaying ? pauseVideo : resumeVideo} style={[styles.spotifyPlayBtn, { backgroundColor: theme.text }]}>
                  {isPlaying ? <Pause size={38} color={isDarkMode ? '#000' : '#FFF'} fill={isDarkMode ? '#000' : '#FFF'} /> : <Play size={38} color={isDarkMode ? '#000' : '#FFF'} fill={isDarkMode ? '#000' : '#FFF'} style={{ marginLeft: 4 }} />}
                </TouchableOpacity>
                
                <TouchableOpacity onPress={playNext} style={styles.sideBtn}>
                  <SkipForward size={32} color={theme.text} fill={theme.text} />
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleRepeat} style={styles.sideBtn}>
                  <Repeat size={26} color={isRepeat ? theme.primary : (isDarkMode ? '#666' : '#999')} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={styles.videoScroll}>
              <View style={styles.videoWrapper}>
                {isYoutube ? (
                  <YoutubeIframe 
                    ref={ytPlayerRef}
                    key={currentVideo?.id?.videoId || 'yt-player'}
                    height={width * 0.5625} width={width} play={isPlaying} videoId={currentVideo?.id?.videoId}
                    onChangeState={(state) => {
                      if (state === 'playing') resumeVideo();
                      else if (state === 'paused') pauseVideo();
                      else if (state === 'ended') {
                        if (isRepeat) {
                          ytPlayerRef.current?.seekTo(0, true);
                          resumeVideo();
                        } else {
                          pauseVideo();
                          playNext();
                        }
                      }
                    }}
                    initialPlayerParams={{ rel: 0, modestbranding: 1, controls: 0 }}
                  />
                ) : (
                  <VideoView 
                    ref={videoViewRef}
                    key={directUrl} 
                    player={player} 
                    style={styles.fullVideo} 
                    contentFit="contain" 
                    nativeControls={false} 
                    allowsFullscreen={true}
                  />
                )}

                {/* Touch Layer to toggle controls */}
                <TouchableOpacity 
                  activeOpacity={1} 
                  onPress={handleVideoTouch} 
                  style={[StyleSheet.absoluteFill, { zIndex: 1 }]} 
                />

                <Animated.View 
                  pointerEvents={showControls ? 'auto' : 'none'}
                  style={[styles.videoOverlay, { opacity: showControls ? 1 : 0, zIndex: 2 }]}
                >
                  {/* Top Controls (Close/Minimize if needed) */}
                  <View style={styles.overlayTop}>
                    {/* Empty for now but helps with spacing */}
                  </View>

                  {/* Center Controls */}
                  <View style={styles.overlayMain}>
                    <View style={styles.mainControlGroup}>
                      <TouchableOpacity onPress={playPrev} style={styles.overlaySideBtn}><SkipBack size={30} color="#FFF" fill="#FFF" /></TouchableOpacity>
                      <TouchableOpacity onPress={() => seek(-10)} style={styles.seekBtn}><Text style={styles.seekText}>-10s</Text></TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity onPress={isPlaying ? pauseVideo : resumeVideo} style={styles.overlayPlay}>
                      {isPlaying ? <Pause size={42} color="#FFF" fill="#FFF" /> : <Play size={42} color="#FFF" fill="#FFF" style={{ marginLeft: 4 }} />}
                    </TouchableOpacity>

                    <View style={styles.mainControlGroup}>
                      <TouchableOpacity onPress={() => seek(10)} style={styles.seekBtn}><Text style={styles.seekText}>+10s</Text></TouchableOpacity>
                      <TouchableOpacity onPress={playNext} style={styles.overlaySideBtn}><SkipForward size={30} color="#FFF" fill="#FFF" /></TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Bottom Controls */}
                  <View style={styles.overlayBottom}>
                    <View style={styles.bottomInfoRow}>
                      <Text style={styles.overlayTime}>{formatTime(position)} {isUnknownDuration ? '' : `/ ${displayDuration}`}</Text>
                      {!isYoutube && (
                        <TouchableOpacity 
                          onPress={() => {
                            try {
                              if (videoViewRef.current && typeof videoViewRef.current.enterFullscreen === 'function') {
                                videoViewRef.current.enterFullscreen();
                              } else if (player && typeof player.enterFullscreen === 'function') {
                                player.enterFullscreen();
                              }
                            } catch (e) {}
                          }}
                          style={styles.fullscreenBtn}
                        >
                          <Maximize size={20} color="#FFF" />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    <View 
                      {...panResponder.current.panHandlers}
                      onLayout={(e) => updateBarWidth(e.nativeEvent.layout.width)}
                      style={styles.progressBarTouchable}
                    >
                      <View style={styles.overlayProgBg} pointerEvents="none">
                        <View style={[styles.overlayProgFill, { width: isUnknownDuration ? '0%' : `${progressPct}%`, backgroundColor: theme.primary }]} />
                        <View style={[styles.overlayProgHandle, { left: isUnknownDuration ? '0%' : `${progressPct}%`, backgroundColor: theme.primary }]} />
                      </View>
                    </View>
                  </View>
                </Animated.View>

                {isBuffering && <View style={styles.loaderOverlay}><ActivityIndicator size="large" color={theme.primary} /></View>}
              </View>

              <View style={styles.videoInfoArea}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.videoTtl, { color: theme.text }]} numberOfLines={2}>{title}</Text>
                  <Text style={[styles.videoSub, { color: theme.primary }]}>{category}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => toggleFavorite(currentVideo)} style={styles.actionCircle}>
                    <Heart size={22} color={isFav ? '#FF3B30' : theme.text} fill={isFav ? '#FF3B30' : 'transparent'} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={async () => {
                      try {
                        const shareUrl = isYoutube ? `https://youtube.com/watch?v=${currentVideo.id?.videoId || currentVideo.id}` : (currentVideo.url || currentVideo.audioUrl);
                        await Share.share({
                          message: `🙏 Jai Shree Ram! 🙏\n\nListen to "${title}"\n\n🎵 Listen here: ${shareUrl}\n\n📲 Download *${CONFIG.APP_NAME}* for more:\n${CONFIG.PLAY_STORE_URL}`,
                        });
                      } catch (e) {}
                    }}
                    style={styles.actionCircle}
                  >
                    <Share2 size={22} color={theme.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.spotifyCtrlRow, { marginTop: 10, marginBottom: 20 }]}>
                <TouchableOpacity onPress={toggleShuffle} style={styles.sideBtn}>
                  <Shuffle size={24} color={isShuffle ? theme.primary : (isDarkMode ? '#666' : '#999')} />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={playPrev} style={styles.sideBtn}>
                  <SkipBack size={28} color={theme.text} fill={theme.text} />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={isPlaying ? pauseVideo : resumeVideo} style={[styles.spotifyPlayBtn, { width: 56, height: 56, backgroundColor: theme.text }]}>
                  {isPlaying ? <Pause size={30} color={isDarkMode ? '#000' : '#FFF'} fill={isDarkMode ? '#000' : '#FFF'} /> : <Play size={30} color={isDarkMode ? '#000' : '#FFF'} fill={isDarkMode ? '#000' : '#FFF'} style={{ marginLeft: 4 }} />}
                </TouchableOpacity>
                
                <TouchableOpacity onPress={playNext} style={styles.sideBtn}>
                  <SkipForward size={28} color={theme.text} fill={theme.text} />
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleRepeat} style={styles.sideBtn}>
                  <Repeat size={24} color={isRepeat ? theme.primary : (isDarkMode ? '#666' : '#999')} />
                </TouchableOpacity>
              </View>

              <View style={styles.upNextContainer}>
                <View style={styles.upNextHeader}>
                  <List size={20} color={theme.text} />
                  <Text style={[styles.upNextTtl, { color: theme.text }]}>Up Next</Text>
                </View>
                {upNext.map((item, idx) => (
                  <TouchableOpacity key={idx} style={styles.upNextItem} onPress={() => playVideo(item, queue)}>
                    <Image source={{ uri: item.thumbnail || item.image_url || item.snippet?.thumbnails?.high?.url }} style={styles.upNextThumb} />
                    <View style={styles.upNextInfo}>
                      <Text style={[styles.upNextItemTtl, { color: theme.text }]} numberOfLines={2}>{item.title || item.snippet?.title}</Text>
                      <Text style={[styles.upNextItemSub, { color: theme.subtext }]}>{item.category || item.snippet?.channelTitle}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              {/* LYRICS SECTION */}
              {(currentVideo?.description || currentVideo?.snippet?.description) && (
                <View style={styles.lyricsSection}>
                  <View style={styles.lyricsHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <BookOpen size={20} color={theme.primary} />
                      <Text style={[styles.lyricsTitle, { color: theme.text }]}>{t('lyrics')}</Text>
                    </View>
                    <View style={styles.fontSizeCtrls}>
                      <TouchableOpacity 
                        onPress={() => setLyricsFontSize(prev => Math.max(12, prev - 2))} 
                        style={[styles.fontSizeBtn, { backgroundColor: 'rgba(255,255,255,0.05)' }]}
                      >
                        <Minus size={14} color={theme.text} />
                      </TouchableOpacity>
                      <Type size={16} color={theme.primary} />
                      <TouchableOpacity 
                        onPress={() => setLyricsFontSize(prev => Math.min(32, prev + 2))} 
                        style={[styles.fontSizeBtn, { backgroundColor: 'rgba(255,255,255,0.05)' }]}
                      >
                        <Plus size={14} color={theme.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={[styles.lyricsContent, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}>
                    <Text style={[styles.lyricsText, { color: isDarkMode ? theme.text : '#1A1A1A', fontSize: lyricsFontSize, opacity: 1 }]}>
                    {(currentVideo?.lyrics || currentVideo?.description || currentVideo?.snippet?.description || '')
                      .replace(/(\d{1,2}):(\d{1,2}):(\d{1,2})|(\d{1,2}):(\d{1,2})/g, '') // Remove timestamps
                      .replace(/\[.*?\]/g, '') // Remove [Music] etc
                      .split('\n')
                      .filter(line => line.trim() !== '') // Remove empty lines
                      .join('\n')
                    }
                  </Text>
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </Animated.View>

        {/* MINI PLAYER */}
        <Animated.View style={[
          styles.miniBar, 
          { 
            opacity: expandAnim.interpolate({ inputRange: [0, 0.3], outputRange: [1, 0] }),
            backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF',
            borderTopColor: theme.border,
            borderTopWidth: isDarkMode ? 0 : 1,
            elevation: 20,
            shadowColor: theme.shadow,
            shadowOpacity: 0.2,
            shadowRadius: 10,
          }
        ]} pointerEvents={isExpanded ? 'none' : 'auto'}>
          <TouchableOpacity activeOpacity={1} onPress={toggleExpand} style={styles.miniContent}>
            {thumbnail ? <Image source={{ uri: thumbnail }} style={styles.miniArt} /> : <View style={[styles.miniArt, { backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' }]}><Text>🎵</Text></View>}
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.miniTtl, { color: theme.text }]} numberOfLines={1}>{title}</Text>
              <Text style={[styles.miniSts, { color: theme.subtext }]}>{isBuffering ? t('connecting') : isPlaying ? t('playing') : t('paused')}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
              <TouchableOpacity onPress={() => isPlaying ? pauseVideo() : resumeVideo()}>
                {isPlaying ? <Pause size={28} color={theme.primary} /> : <Play size={28} color={theme.primary} />}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClose} style={{ padding: 4 }}>
                <X size={22} color={theme.subtext} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sliderWrapper: {
    width: width,
    height: width - 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  artworkSlider: {
    width: width,
  },
  slideItem: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lyricsSlideContainer: {
    width: width - 60,
    height: width - 40,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
  },
  lyricsSlideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  lyricsSlideTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
  },
  lyricsSlideContent: {
    paddingBottom: 20,
  },
  lyricsSlideText: {
    lineHeight: 28,
    fontFamily: 'Outfit-Medium',
    textAlign: 'center',
    opacity: 0.8,
  },
  fontSizeCtrls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 4,
    borderRadius: 20,
  },
  fontSizeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  autoScrollToggle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 10,
  },
  lyricLine: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginVertical: 4,
  },
  activeLyricLine: {
    backgroundColor: 'rgba(255,193,7,0.08)',
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  container: { position: 'absolute', left: 0, right: 0, overflow: 'hidden', zIndex: 10000, elevation: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, height: 120 },
  headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  headerTtl: { fontSize: 13, fontFamily: 'Outfit-Black', textTransform: 'uppercase', letterSpacing: 2, opacity: 0.8 },
  
  audioContainer: { flex: 1, paddingBottom: 40, alignItems: 'center', justifyContent: 'center' },
  artworkContainer: { 
    width: width - 80, 
    aspectRatio: 1, 
    borderRadius: 32, 
    overflow: 'hidden', 
    elevation: 20, 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 20,
    backgroundColor: '#121212',
    marginTop: -20,
  },
  artwork: { width: '100%', height: '100%' },
  audioInfoArea: { width: '100%', flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 12, paddingHorizontal: 30 },
  spotifyTtl: { fontSize: 22, fontFamily: 'Outfit-Bold', marginBottom: 2, letterSpacing: -0.5 },
  spotifySub: { fontSize: 14, fontFamily: 'Outfit-Medium', textTransform: 'uppercase', letterSpacing: 1 },
  spotifyProgArea: { width: '100%', marginBottom: 20, paddingHorizontal: 30 },
  progBg: { height: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1.5, position: 'relative' },
  progFill: { height: '100%', borderRadius: 1.5 },
  progHandle: { width: 10, height: 10, borderRadius: 5, position: 'absolute', top: -3.5 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  timeT: { fontSize: 11, fontFamily: 'Outfit-Bold', color: '#B3B3B3', opacity: 0.6 },
  spotifyCtrlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 30 },
  sideBtn: {
    padding: 10,
    opacity: 0.9
  },
  spotifyPlayBtn: { 
    width: 68, 
    height: 68, 
    borderRadius: 34, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 15,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },

  videoScroll: { flex: 1 },
  videoWrapper: { 
    width: width, 
    aspectRatio: 16 / 9, 
    backgroundColor: '#000',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  fullVideo: { width: '100%', height: '100%' },
  videoInfoArea: { paddingHorizontal: 24, marginTop: 24 },
  videoTtl: { fontSize: 22, fontFamily: 'Outfit-Bold', lineHeight: 30 },
  videoSub: { fontSize: 14, fontFamily: 'Outfit-Black', marginTop: 6, textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.7 },
  
  upNextContainer: { paddingHorizontal: 24, marginTop: 32, paddingBottom: 100 },
  upNextHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  upNextTtl: { fontSize: 18, fontFamily: 'Outfit-Bold' },
  upNextItem: { 
    flexDirection: 'row', 
    gap: 16, 
    marginBottom: 20, 
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  upNextThumb: { width: 100, height: 60, borderRadius: 12 },
  upNextInfo: { flex: 1 },
  upNextItemTtl: { fontSize: 15, fontFamily: 'Outfit-Bold' },
  upNextItemSub: { fontSize: 12, fontFamily: 'Outfit-Medium', marginTop: 4, opacity: 0.5 },

  videoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'space-between', paddingVertical: 20 },
  overlayTop: { height: 40, width: '100%' },
  overlayMain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', paddingHorizontal: 20 },
  mainControlGroup: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'center' },
  overlaySideBtn: { padding: 10 },
  seekBtn: { width: 44, alignItems: 'center' },
  seekText: { color: '#FFF', fontSize: 11, fontFamily: 'Outfit-Bold', opacity: 0.9 },
  overlayPlay: { 
    width: 84, 
    height: 84, 
    borderRadius: 42, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  overlayBottom: { paddingHorizontal: 24, paddingBottom: 10, width: '100%' },
  bottomInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  overlayTime: { color: '#FFF', fontSize: 13, fontFamily: 'Outfit-Bold', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 },
  fullscreenBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  progressBarTouchable: { width: '100%', height: 40, justifyContent: 'center' },
  overlayProgBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, position: 'relative' },
  overlayProgFill: { height: '100%', borderRadius: 2 },
  overlayProgHandle: { width: 12, height: 12, borderRadius: 6, position: 'absolute', top: -4, marginLeft: -6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 3 },

  loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  miniBar: { 
    ...StyleSheet.absoluteFillObject, 
    height: 75, 
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  miniContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  miniArt: { width: 50, height: 50, borderRadius: 12 },
  miniTtl: { fontSize: 15, fontFamily: 'Outfit-Bold' },
  miniSts: { fontSize: 12, fontFamily: 'Outfit-Medium', color: '#9CA3AF', marginTop: 2 },

  lyricsSection: { paddingHorizontal: 24, marginTop: 10, marginBottom: 120 },
  lyricsHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  lyricsTitle: { fontSize: 18, fontFamily: 'Outfit-Bold' },
  lyricsContent: { 
    padding: 20, 
    borderRadius: 24, 
    borderWidth: 1,
    minHeight: 150 
  },
  lyricsText: { 
    lineHeight: 28, 
    fontFamily: 'Outfit-Medium',
    opacity: 0.9,
    textAlign: 'center'
  }
});
