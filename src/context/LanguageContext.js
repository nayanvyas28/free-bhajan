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
    logout: 'Logout',
    logoutConfirm: 'Are you sure you want to sign out?',
    cancel: 'Cancel',
    error: 'Error',
    success: 'Success',
    nameEmpty: 'Name cannot be empty',
    profileUpdated: 'Profile updated successfully',
    spiritualLibrary: 'Spiritual Library',
    searchPlaceholder: 'Search for divine melodies...',
    retry: 'Try Again',
    // Categories & Deities
    Krishna: 'Krishna',
    Shiv: 'Shiv',
    Mahadev: 'Mahadev',
    Laxmi: 'Laxmi',
    Ram: 'Ram',
    Hanuman: 'Hanuman',
    Ganesh: 'Ganesh',
    Devi: 'Devi',
    Durga: 'Durga',
    Saraswati: 'Saraswati',
    'Mangal Dosh': 'Mangal Dosh',
    'Shani Dosh': 'Shani Dosh',
    All: 'All',
    deity: 'Deities',
    dosh: 'Dosh Guidance',
    deities: 'Devotional Deities',
    kundliDosh: 'Kundli Dosh Guidance',
    devotionalSelection: 'Devotional Selection',
    astrologicalGuide: 'Astrological Guide',
    solutionTitle: 'Spiritual Solutions',
    watchVideo: 'Watch Video Solution',
    Health: 'Health',
    Wealth: 'Wealth',
    Job: 'Job',
    Family: 'Family',
    Peace: 'Peace',
    'Kaal Sarp': 'Kaal Sarp',
    theme: 'App Theme',
    themeSystem: 'System Default',
    themeLight: 'Light Mode',
    themeDark: 'Dark Mode',
    about: 'About Mantra Puja',
    removeFavTitle: 'Remove from Favorites',
    removeFavMsg: 'Do you want to remove this from your divine collection?',
    remove: 'Remove',
    trackFound: 'Track Found',
    tracksFound: 'Tracks Found',
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
    noData: 'कोई डेटा नहीं मिला',
    settings: 'सेटिंग्स',
    profile: 'प्रोफ़ाइल',
    about: 'हमारे बारे में',
    logout: 'लॉगआउट',
    logoutConfirm: 'क्या आप वाकई लॉग आउट करना चाहते हैं?',
    cancel: 'रद्द करें',
    error: 'त्रुटि',
    success: 'सफलता',
    nameEmpty: 'नाम खाली नहीं हो सकता',
    profileUpdated: 'प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई',
    spiritualLibrary: 'आध्यात्मिक पुस्तकालय',
    searchPlaceholder: 'भजन या मंत्र खोजें...',
    retry: 'फिर कोशिश करें',
    // Categories & Deities
    Krishna: 'कृष्ण',
    Shiv: 'शिव',
    Mahadev: 'महादेव',
    Laxmi: 'लक्ष्मी',
    Ram: 'राम',
    Hanuman: 'हनुमान',
    Ganesh: 'गणेश',
    Devi: 'देवी',
    Durga: 'दुर्गा',
    Saraswati: 'सरस्वती',
    'Mangal Dosh': 'मंगल दोष',
    'Shani Dosh': 'शनि दोष',
    All: 'सभी',
    deity: 'देवी-देवता',
    dosh: 'दोष मार्गदर्शन',
    deities: 'भक्तिमय देवी-देवता',
    kundliDosh: 'कुंडली दोष मार्गदर्शन',
    devotionalSelection: 'भक्तिमय चयन',
    astrologicalGuide: 'ज्योतिषीय मार्गदर्शन',
    solutionTitle: 'आध्यात्मिक समाधान',
    watchVideo: 'वीडियो समाधान देखें',
    Health: 'स्वास्थ्य',
    Wealth: 'धन-सम्पत्ति',
    Job: 'नौकरी/व्यवसाय',
    Family: 'परिवार',
    Peace: 'शांति',
    'Kaal Sarp': 'काल सर्प दोष',
    about: 'मंत्र पूजा के बारे में',
    removeFavTitle: 'पसंदीदा से हटाएं',
    removeFavMsg: 'क्या आप इसे अपने संग्रह से हटाना चाहते हैं?',
    remove: 'हटाएं',
    trackFound: 'भजन मिला',
    tracksFound: 'भजन मिले',
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
    if (!key) return '';
    // Try exact match first, then lowercase match
    const langSet = translations[language];
    if (langSet[key]) return langSet[key];
    
    // Fallback for case-insensitive matching (e.g. mahadev -> Mahadev)
    const foundKey = Object.keys(langSet).find(k => k.toLowerCase() === key.toLowerCase());
    return foundKey ? langSet[foundKey] : key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
