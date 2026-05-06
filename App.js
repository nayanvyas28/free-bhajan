import React, { useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { PlayerProvider } from './src/context/PlayerContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { AlertProvider } from './src/context/AlertContext';
import GlobalPlayer from './src/components/GlobalPlayer';

import { useFonts, Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold, Outfit_900Black } from '@expo-google-fonts/outfit';
import * as SplashScreen from 'expo-splash-screen';
import { LogBox } from 'react-native';

LogBox.ignoreLogs(['Call to function \'ExpoKeepAwake.activate\' has been rejected']);
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Outfit-Regular': Outfit_400Regular,
    'Outfit-SemiBold': Outfit_600SemiBold,
    'Outfit-Bold': Outfit_700Bold,
    'Outfit-Black': Outfit_900Black,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AlertProvider>
          <PlayerProvider>
            <SafeAreaProvider onLayout={onLayoutRootView}>
              <NavigationContainer>
                <StatusBar style="auto" />
                <AppNavigator />
                <GlobalPlayer />
              </NavigationContainer>
            </SafeAreaProvider>
          </PlayerProvider>
        </AlertProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
