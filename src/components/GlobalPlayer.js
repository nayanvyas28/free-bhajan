import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Dimensions, Animated, ActivityIndicator, PanResponder
} from 'react-native';
import { Play, Pause, X, ChevronDown, SkipBack, SkipForward, List } from 'lucide-react-native';
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
  const { currentVideo, isPlaying, pauseVideo, resumeVideo, closePlayer, playNext, playPrev, queue, playVideo } = usePlayer();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const prevUrlRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);
  const ytPlayerRef = useRef(null);

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

    const urlWithBust = directUrl; // Removed cache buster to fix Range/Seeking issues
    player.replace({
      uri: urlWithBust,
      metadata: {
        title: currentVideo?.title || 'Divine Bhajan',
        artist: currentVideo?.category || 'Mantra Puja',
        duration: currentVideo?.duration || 0
      }
    });
    
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

    // Safe Interval using Ref to avoid "already released" errors
    const interval = setInterval(() => {
      if (!isEffectActive || !playerRef.current) return;
      try {
        if (!isYoutube && !isDraggingRef.current && !isSeekingRef.current) {
          const curTime = playerRef.current.currentTime || 0;
          if (curTime >= 0) setPosition(curTime);
          
          const totalTime = playerRef.current.duration || (playerRef.current.currentItem && playerRef.current.currentItem.duration) || 0;
          if (totalTime > 0) {
            setDuration((prev) => (Math.abs(prev - totalTime) > 0.5 ? totalTime : prev));
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
  }, [player, isYoutube, directUrl]);

  // Sync Play/Pause state
  useEffect(() => {
    if (!player || isYoutube) return;
    if (isPlaying) {
      player.play();
    } else {
      player.pause();
    }
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
        
        const bX = evt.nativeEvent.pageX - evt.nativeEvent.locationX;
        updateBarX(bX);
        if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      },
      onPanResponderMove: (evt, gestureState) => {
        const dur = getEffectiveDuration();
        if (dur <= 0 && !isYoutubeRef.current) return;
        
        const touchX = gestureState.moveX || evt.nativeEvent.pageX;
        const bWidth = barWidthRef.current || 1;
        
        let newPct = (touchX - barXRef.current) / bWidth;
        newPct = Math.min(Math.max(newPct, 0), 1);
        setDragProgress(newPct * 100);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const dur = getEffectiveDuration();
        if (dur <= 0 && !isYoutubeRef.current) return;
        
        isDraggingRef.current = false;
        setIsDragging(false);
        
        const touchX = gestureState.moveX || evt.nativeEvent.pageX;
        const bWidth = barWidthRef.current || 1;
        
        let newPct = (touchX - barXRef.current) / bWidth;
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
        
        setTimeout(() => { 
          isSeekingRef.current = false; 
        }, 1000); 
        setShowControls(true);
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
  const category = currentVideo?.category || currentVideo?.snippet?.channelTitle || 'Mantra Puja';

  const upNext = queue.filter(v => (v.id?.videoId || v.id) !== (currentVideo.id?.videoId || currentVideo.id)).slice(0, 10);

  return (
    <Animated.View style={[styles.container, {
      height: expandAnim.interpolate({ inputRange: [0, 1], outputRange: [70, height] }),
      bottom: expandAnim.interpolate({ inputRange: [0, 1], outputRange: [85, 0] }),
      borderRadius: expandAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] })
    }]}>
      <LinearGradient colors={isDarkMode ? ['#0F172A', '#020617'] : ['#FFFFFF', '#F8FAFC']} style={StyleSheet.absoluteFill}>
        
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
              <View style={[styles.artworkContainer, { shadowColor: theme.primary }]}>
                {thumbnail ? <Image source={{ uri: thumbnail }} style={styles.artwork} /> : 
                <LinearGradient colors={[theme.primary, '#000']} style={styles.artwork}><Text style={{ fontSize: 80 }}>🎵</Text></LinearGradient>}
              </View>
              <View style={styles.audioInfoArea}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.spotifyTtl, { color: theme.text }]} numberOfLines={1}>{title}</Text>
                  <Text style={[styles.spotifySub, { color: theme.primary }]}>{category}</Text>
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
                <TouchableOpacity onPress={playPrev}><SkipBack size={32} color={theme.text} fill={theme.text} /></TouchableOpacity>
                <TouchableOpacity onPress={isPlaying ? pauseVideo : resumeVideo} style={[styles.spotifyPlayBtn, { backgroundColor: theme.text }]}>
                  {isPlaying ? <Pause size={38} color={isDarkMode ? '#000' : '#FFF'} fill={isDarkMode ? '#000' : '#FFF'} /> : <Play size={38} color={isDarkMode ? '#000' : '#FFF'} fill={isDarkMode ? '#000' : '#FFF'} style={{ marginLeft: 4 }} />}
                </TouchableOpacity>
                <TouchableOpacity onPress={playNext}><SkipForward size={32} color={theme.text} fill={theme.text} /></TouchableOpacity>
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
                    initialPlayerParams={{ rel: 0, modestbranding: 1, controls: 0 }}
                  />
                ) : (
                  <VideoView key={directUrl} player={player} style={styles.fullVideo} contentFit="contain" nativeControls={false} />
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
                  <View style={styles.overlayMain}>
                    <TouchableOpacity onPress={() => seek(-10)}><SkipBack size={32} color="#FFF" /></TouchableOpacity>
                    <TouchableOpacity onPress={isPlaying ? pauseVideo : resumeVideo} style={styles.overlayPlay}>
                      {isPlaying ? <Pause size={44} color="#FFF" fill="#FFF" /> : <Play size={44} color="#FFF" fill="#FFF" style={{ marginLeft: 5 }} />}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => seek(10)}><SkipForward size={32} color="#FFF" /></TouchableOpacity>
                  </View>
                  
                  <View style={styles.overlayBottom}>
                    <Text style={styles.overlayTime}>{formatTime(position)} {isUnknownDuration ? '' : `/ ${displayDuration}`}</Text>
                    <View 
                      {...panResponder.current.panHandlers}
                      onLayout={(e) => updateBarWidth(e.nativeEvent.layout.width)}
                      style={styles.progressBarTouchable}
                    >
                      <View style={[styles.overlayProgBg, { position: 'relative' }]}>
                        <View style={[styles.overlayProgFill, { width: isUnknownDuration ? '0%' : `${progressPct}%`, backgroundColor: theme.primary }]} />
                        <View style={[styles.overlayProgHandle, { left: isUnknownDuration ? '0%' : `${progressPct}%`, backgroundColor: theme.primary }]} />
                      </View>
                    </View>
                  </View>
                </Animated.View>



                {isBuffering && <View style={styles.loaderOverlay}><ActivityIndicator size="large" color={theme.primary} /></View>}
              </View>

              <View style={styles.videoInfoArea}>
                <Text style={[styles.videoTtl, { color: theme.text }]} numberOfLines={2}>{title}</Text>
                <Text style={[styles.videoSub, { color: theme.primary }]}>{category}</Text>
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
            </ScrollView>
          )}
        </Animated.View>

        {/* MINI PLAYER */}
        <Animated.View style={[styles.miniBar, { opacity: expandAnim.interpolate({ inputRange: [0, 0.3], outputRange: [1, 0] }) }]} pointerEvents={isExpanded ? 'none' : 'auto'}>
          <TouchableOpacity activeOpacity={1} onPress={toggleExpand} style={styles.miniContent}>
            {thumbnail ? <Image source={{ uri: thumbnail }} style={styles.miniArt} /> : <View style={[styles.miniArt, { backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' }]}><Text>🎵</Text></View>}
            <View style={{ flex: 1, marginLeft: 14 }}><Text style={[styles.miniTtl, { color: theme.text }]} numberOfLines={1}>{title}</Text><Text style={styles.miniSts}>{isBuffering ? t('connecting') : isPlaying ? t('playing') : t('paused')}</Text></View>
            <TouchableOpacity onPress={() => isPlaying ? pauseVideo() : resumeVideo()}>{isPlaying ? <Pause size={26} color={theme.primary} /> : <Play size={26} color={theme.primary} />}</TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 0, right: 0, overflow: 'hidden', zIndex: 10000, elevation: 25 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, height: 110 },
  headerBtn: { padding: 8 },
  headerTtl: { fontSize: 14, fontFamily: 'Outfit-Bold', textTransform: 'uppercase', letterSpacing: 1 },
  
  audioContainer: { flex: 1, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center' },
  artworkContainer: { width: width - 64, aspectRatio: 1, borderRadius: 24, overflow: 'hidden', elevation: 20, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
  artwork: { width: '100%', height: '100%', borderRadius: 24 },
  audioInfoArea: { width: '100%', flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 20 },
  spotifyTtl: { fontSize: 24, fontFamily: 'Outfit-Bold', marginBottom: 4 },
  spotifySub: { fontSize: 16, fontFamily: 'Outfit-Medium', opacity: 0.8 },
  spotifyProgArea: { width: '100%', marginBottom: 30 },
  progBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, position: 'relative' },
  progFill: { height: '100%', borderRadius: 2 },
  progHandle: { width: 12, height: 12, borderRadius: 6, position: 'absolute', top: -4 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  timeT: { fontSize: 12, fontFamily: 'Outfit-Medium', color: '#94A3B8' },
  spotifyCtrlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 20 },
  spotifyPlayBtn: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', elevation: 5 },

  videoScroll: { flex: 1 },
  videoWrapper: { width: width, aspectRatio: 16 / 9, backgroundColor: '#000' },
  nativeVideoBox: { width: '100%', height: '100%', justifyContent: 'center' },
  fullVideo: { width: '100%', height: '100%' },
  videoInfoArea: { paddingHorizontal: 20, marginTop: 20 },
  videoTtl: { fontSize: 20, fontFamily: 'Outfit-Bold' },
  videoSub: { fontSize: 14, fontFamily: 'Outfit-Medium', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  
  upNextContainer: { paddingHorizontal: 20, marginTop: 30, paddingBottom: 100 },
  upNextHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  upNextTtl: { fontSize: 16, fontFamily: 'Outfit-Bold' },
  upNextItem: { flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'center' },
  upNextThumb: { width: 120, height: 68, borderRadius: 12 },
  upNextInfo: { flex: 1 },
  upNextItemTtl: { fontSize: 14, fontFamily: 'Outfit-Bold' },
  upNextItemSub: { fontSize: 11, fontFamily: 'Outfit-Medium', marginTop: 4 },

  videoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  overlayMain: { flexDirection: 'row', alignItems: 'center', gap: 50 },
  overlayPlay: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  overlayBottom: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  overlayTime: { color: '#FFF', fontSize: 13, fontFamily: 'Outfit-Bold', marginBottom: 12, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  progressBarTouchable: { width: '100%', height: 24, justifyContent: 'center' },
  overlayProgBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  overlayProgFill: { height: '100%', borderRadius: 3 },
  overlayProgHandle: { width: 14, height: 14, borderRadius: 7, position: 'absolute', top: -4.5, marginLeft: -7 },


  loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  miniBar: { ...StyleSheet.absoluteFillObject, height: 70 },
  miniContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  miniArt: { width: 48, height: 48, borderRadius: 8 },
  miniTtl: { fontSize: 14, fontFamily: 'Outfit-Bold' },
  miniSts: { fontSize: 11, fontFamily: 'Outfit-Medium', color: '#64748B' }
});
