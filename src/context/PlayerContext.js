import React, { createContext, useState, useContext, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native';
import { searchBhajans, getCuratedBhajans, getSolutions, getKathas } from '../services/youtubeApi';
import { saveFavorite, getFavorites, removeFavorite } from '../storage/favorites';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PlayerContext = createContext();

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [favIds, setFavIds] = useState([]);
  const { profile, getListeningLimit } = useAuth();

  // Refs so callbacks always have fresh values (no stale closure)
  const queueRef = useRef([]);
  const indexRef = useRef(-1);
  const shuffleRef = useRef(false);

  const loadFavorites = async () => {
    try {
      const favs = await getFavorites();
      setFavIds(favs.map(f => f.id?.videoId || f.id));
    } catch (e) {}
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => {
    const checkSharedBhajanReferrer = async () => {
      try {
        let InstallReferrer = null;
        try {
          InstallReferrer = require('react-native-install-referrer').default || require('react-native-install-referrer');
        } catch (e) {
          console.log('[REFERRER-PLAY] Module not available');
        }

        if (InstallReferrer && typeof InstallReferrer.getReferrer === 'function') {
          const referrerData = await InstallReferrer.getReferrer();
          console.log('[REFERRER-PLAY] Install Referrer response:', referrerData);
          if (referrerData && referrerData.installReferrer) {
            const referrerStr = referrerData.installReferrer;
            const idMatch = referrerStr.match(/id_([A-Za-z0-9_-]+)/i);
            if (idMatch && idMatch[1]) {
              const sharedBhajanId = idMatch[1];
              console.log('[REFERRER-PLAY] Found shared bhajan ID:', sharedBhajanId);
              
              const playedKey = `@shared_bhajan_played_${sharedBhajanId}`;
              const alreadyPlayed = await AsyncStorage.getItem(playedKey);
              if (!alreadyPlayed) {
                await AsyncStorage.setItem(playedKey, 'true');
                const { getBhajanById } = require('../services/youtubeApi');
                const bhajanObj = await getBhajanById(sharedBhajanId);
                if (bhajanObj) {
                  console.log('[REFERRER-PLAY] Auto-playing shared bhajan:', bhajanObj.title);
                  // Allow component mounting to settle before triggering
                  setTimeout(() => {
                    playVideo(bhajanObj);
                  }, 1500);
                }
              }
            }
          }
        }
      } catch (err) {
        console.log('[REFERRER-PLAY] Error checking shared bhajan:', err);
      }
    };

    // Delay checking slightly to ensure player state is initialized
    const timer = setTimeout(() => {
      checkSharedBhajanReferrer();
    }, 2500);

    return () => clearTimeout(timer);
  }, [profile, playVideo]);

  const toggleFavorite = useCallback(async (video) => {
    if (!video) return;
    const videoId = video.id?.videoId || video.id;
    setFavIds(prev => {
      const isFav = prev.includes(videoId);
      if (isFav) {
        removeFavorite(videoId);
        return prev.filter(id => id !== videoId);
      } else {
        saveFavorite(video);
        return [...prev, videoId];
      }
    });
  }, []);

  const playVideo = useCallback(async (video, videoList = []) => {
    if (!video) return;
    
    // Normalize video object
    const videoId = video.id?.videoId || video.id;
    const normalizedVideo = {
      ...video,
      id: typeof video.id === 'object' ? video.id : { videoId: video.id },
      type: video.type || (video.audioUrl || (typeof videoId === 'string' && videoId.length > 20) ? 'video' : 'youtube') 
    };

    // SET IMMEDIATELY for instant UI response
    setCurrentVideo(normalizedVideo);
    setIsPlaying(true);
    
    let finalQueue = videoList.length > 0 ? [...videoList] : [normalizedVideo];
    
    // Set initial queue and index first
    setQueue(finalQueue);
    queueRef.current = finalQueue;
    const initialIndex = finalQueue.findIndex(v => (v.id?.videoId || v.id) === videoId);
    setCurrentIndex(initialIndex === -1 ? 0 : initialIndex);
    indexRef.current = initialIndex === -1 ? 0 : initialIndex;

    // Suggestion logic...
    if (videoList.length === 0 && finalQueue.length <= 5) {
      try {
        let suggestions = [];
        if (normalizedVideo.is_solution) {
          const dedicated = await getSolutions();
          const bhajanSolutions = await getCuratedBhajans('Solution');
          const bhajanUpays = await getCuratedBhajans('Upay');
          suggestions = [...dedicated, ...bhajanSolutions, ...bhajanUpays];
        } else if (normalizedVideo.is_katha) {
          const bhajanKathas = await getCuratedBhajans(null, null, 'Katha');
          const dedicatedKathas = await getKathas();
          suggestions = [...bhajanKathas, ...dedicatedKathas];
        } else {
          const category = normalizedVideo.snippet?.channelTitle !== 'Bhajan' ? normalizedVideo.snippet?.channelTitle : null;
          const rawSuggestions = await getCuratedBhajans(category, null);
          suggestions = rawSuggestions.filter(s => !s.is_solution && !s.is_katha);
        }
        
        if (suggestions && suggestions.length > 0) {
          const filteredSuggestions = suggestions
            .filter(b => (b.id?.videoId || b.id) !== videoId)
            .sort(() => 0.5 - Math.random())
            .slice(0, 15);
            
          const updatedQueue = [normalizedVideo, ...filteredSuggestions];
          setQueue(updatedQueue);
          queueRef.current = updatedQueue;
        }
      } catch (err) {}
    }
  }, [profile, getListeningLimit]);

  const playNext = useCallback(() => {
    const q = queueRef.current;
    if (q.length === 0) return;

    if (profile && (profile.listening_time_used || 0) >= getListeningLimit()) {
      setIsPlaying(false);
      return;
    }

    let nextIndex = indexRef.current + 1;

    if (shuffleRef.current) {
      // Pick random index excluding current if possible
      nextIndex = Math.floor(Math.random() * q.length);
      if (nextIndex === indexRef.current && q.length > 1) {
        nextIndex = (nextIndex + 1) % q.length;
      }
    } else if (nextIndex >= q.length) {
      // Loop back to start if at end
      nextIndex = 0;
    }

    setCurrentVideo(q[nextIndex]);
    setCurrentIndex(nextIndex);
    indexRef.current = nextIndex;
    setIsPlaying(true);
  }, []);

  const playPrev = useCallback(() => {
    const q = queueRef.current;
    const i = indexRef.current;
    if (i > 0) {
      const prevIndex = i - 1;
      setCurrentVideo(q[prevIndex]);
      setCurrentIndex(prevIndex);
      indexRef.current = prevIndex;
      setIsPlaying(true);
    }
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle(prev => {
      shuffleRef.current = !prev;
      return !prev;
    });
  }, []);

  const toggleRepeat = useCallback(() => {
    setIsRepeat(prev => !prev);
  }, []);

  const pauseVideo = useCallback(() => setIsPlaying(false), []);
  const resumeVideo = useCallback(() => setIsPlaying(true), []);

  const closePlayer = useCallback(() => {
    setCurrentVideo(null);
    setIsPlaying(false);
    setQueue([]);
    setCurrentIndex(-1);
    queueRef.current = [];
    indexRef.current = -1;
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentVideo,
        isPlaying,
        playVideo,
        pauseVideo,
        resumeVideo,
        closePlayer,
        playNext,
        playPrev,
        queue,
        isShuffle,
        isRepeat,
        toggleShuffle,
        toggleRepeat,
        favIds,
        toggleFavorite,
        hasHold: queue.length > 0
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};
