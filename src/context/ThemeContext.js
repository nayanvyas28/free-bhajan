import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const themes = {
  dark: {
    background: '#0F0F13',
    card: '#1E1E1E',
    text: '#FFFFFF',
    subtext: '#9CA3AF',
    primary: '#FFB300',
    border: '#2C2C2E',
    shadow: '#000000',
    header: ['#1E1E1E', '#121212'],
  },
  light: {
    background: '#F9FAFB',
    card: '#FFFFFF',
    text: '#111827',
    subtext: '#6B7280',
    primary: '#FFB300',
    border: '#E5E7EB',
    shadow: '#000000',
    header: ['#FFFFFF', '#F3F4F6'],
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
