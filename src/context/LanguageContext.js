import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageContext = createContext();

const translations = {
  en: {
    home: 'Home',
    explore: 'Explore',
    music: 'Music',
    solution: 'Solutions',
    language: 'English',
    devotional: 'Devotional',
    search: 'Search bhajans...',
    all: 'All',
    bhajan: 'Bhajan',
    mantra: 'Mantra',
    nowPlaying: 'NOW PLAYING',
    upNext: 'UP NEXT',
    favorites: 'Favorites',
    categories: 'Categories',
    loading: 'Loading...',
    noData: 'No data available',
    settings: 'Settings',
    profile: 'Profile',
    about: 'About Us',
    logout: 'Logout'
  },
  hi: {
    home: 'होम',
    explore: 'खोजें',
    music: 'संगीत',
    solution: 'समाधान',
    language: 'हिंदी',
    devotional: 'भक्ति',
    search: 'भजन खोजें...',
    all: 'सभी',
    bhajan: 'भजन',
    mantra: 'मंत्र',
    nowPlaying: 'अभी बज रहा है',
    upNext: 'अगला',
    favorites: 'पसंदीदा',
    categories: 'श्रेणियाँ',
    loading: 'लोड हो रहा है...',
    noData: 'कोई डेटा उपलब्ध नहीं है',
    settings: 'सेटिंग्स',
    profile: 'प्रोफ़ाइल',
    about: 'हमारे बारे में',
    logout: 'लॉगआउट'
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem('user_language');
      if (saved) setLanguage(saved);
    } catch (e) {
      console.log('Error loading language', e);
    }
  };

  const toggleLanguage = async () => {
    const newLang = language === 'en' ? 'hi' : 'en';
    setLanguage(newLang);
    try {
      await AsyncStorage.setItem('user_language', newLang);
    } catch (e) {
      console.log('Error saving language', e);
    }
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
