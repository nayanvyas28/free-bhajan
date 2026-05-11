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
    background: '#F8F9FA',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#121212',
    subtext: '#666666',
    primary: '#FFB300',
    secondary: '#FF3D00',
    border: '#EEEEEE',
    shadow: 'rgba(0,0,0,0.05)',
    accent: '#FFA000',
    glass: 'rgba(255, 255, 255, 0.8)',
    header: ['#FFFFFF', '#F8F9FA'],
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
