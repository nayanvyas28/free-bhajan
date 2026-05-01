import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';

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
  const [isDarkMode, setIsDarkMode] = useState(systemScheme === 'dark');

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const theme = isDarkMode ? themes.dark : themes.light;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};
