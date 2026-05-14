import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const themes = {
  dark: {
    background: '#000000',
    surface: '#121212',
    card: '#181818',
    text: '#FFFFFF',
    subtext: '#B3B3B3',
    primary: '#FFC107',
    secondary: '#FF3D00',
    border: '#282828',
    shadow: '#000000',
    accent: '#FFD700',
    glass: 'rgba(255, 255, 255, 0.05)',
    header: ['#121212', '#000000'],
  },
  light: {
    background: '#FFFBF5',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#2C3E50',
    subtext: '#7F8C8D',
    primary: '#FF8F00',
    secondary: '#E67E22',
    border: '#F3E5D8',
    shadow: 'rgba(230, 126, 34, 0.1)',
    accent: '#F39C12',
    glass: 'rgba(255, 255, 255, 0.9)',
    header: ['#FFFFFF', '#FFFBF5'],
  }
};

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState('system'); // 'system', 'light', 'dark'
  const [isDarkMode, setIsDarkMode] = useState(systemScheme === 'dark');

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    if (themeMode === 'system') {
      setIsDarkMode(systemScheme === 'dark');
    } else {
      setIsDarkMode(themeMode === 'dark');
    }
  }, [themeMode, systemScheme]);

  const loadThemePreference = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('theme_mode');
      if (savedMode) setThemeModeState(savedMode);
    } catch (e) {
      console.log('Error loading theme preference', e);
    }
  };

  const setThemeMode = async (mode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem('theme_mode', mode);
    } catch (e) {
      console.log('Error saving theme preference', e);
    }
  };

  const theme = isDarkMode ? themes.dark : themes.light;

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, isDarkMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};
