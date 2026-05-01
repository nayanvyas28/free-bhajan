import React, { createContext, useState, useContext, useCallback, useRef } from 'react';
import { searchBhajans, getCuratedBhajans } from '../services/youtubeApi';

const PlayerContext = createContext();

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Refs so callbacks always have fresh values (no stale closure)
  const queueRef = useRef([]);
  const indexRef = useRef(-1);

  const playVideo = useCallback(async (video, videoList = []) => {
    if (!video) return;
    
    // Normalize video object
    const videoId = video.id?.videoId || video.id;
    const normalizedVideo = {
      ...video,
      id: typeof video.id === 'object' ? video.id : { videoId: video.id },
      type: video.type || (video.audioUrl ? 'audio' : 'youtube') // Ensure type is always set
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

    // Then handle suggestions in the background if needed
    if (finalQueue.length <= 5) {
      try {
        const category = normalizedVideo.snippet?.channelTitle !== 'Bhajan' ? normalizedVideo.snippet?.channelTitle : null;
        const suggestions = await getCuratedBhajans(category, normalizedVideo.type || 'youtube');
        
        if (suggestions && suggestions.length > 0) {
          const filteredSuggestions = suggestions
            .filter(b => (b.id?.videoId || b.id) !== videoId)
            .sort(() => 0.5 - Math.random());
            
          const updatedQueue = [normalizedVideo, ...filteredSuggestions];
          setQueue(updatedQueue);
          queueRef.current = updatedQueue;
          setCurrentIndex(0);
          indexRef.current = 0;
        }
      } catch (err) {
        console.log("Suggestion error:", err);
      }
    }
  }, []);

  const playNext = useCallback(() => {
    const q = queueRef.current;
    const i = indexRef.current;
    if (i < q.length - 1) {
      const nextIndex = i + 1;
      setCurrentVideo(q[nextIndex]);
      setCurrentIndex(nextIndex);
      indexRef.current = nextIndex;
      setIsPlaying(true);
    }
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
        hasHold: queue.length > 0
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};
