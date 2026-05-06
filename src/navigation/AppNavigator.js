import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Search, Lightbulb, Heart, Music, Languages } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import SolutionScreen from '../screens/SolutionScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import AudioScreen from '../screens/AudioScreen';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AboutScreen from '../screens/AboutScreen';
import { AuthProvider } from '../context/AuthContext';
import { PlayerProvider } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { theme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'HomeTab') return <Home size={size} color={color} />;
          if (route.name === 'Explore') return <Search size={size} color={color} />;
          if (route.name === 'Music') return <Music size={size} color={color} />;
          if (route.name === 'Solution') return <Lightbulb size={size} color={color} />;
          if (route.name === 'Favorites') return <Heart size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.subtext,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          height: 60,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontFamily: 'Outfit-Medium',
          fontSize: 12,
        }
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: t('home') }} />
      <Tab.Screen name="Explore" component={ExploreScreen} options={{ title: t('explore') }} />
      <Tab.Screen name="Music" component={AudioScreen} options={{ title: t('music') }} />
      <Tab.Screen name="Solution" component={SolutionScreen} options={{ title: t('solution') }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: t('favorites') }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <AuthProvider>
      <Stack.Navigator 
        initialRouteName="Main"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
      </Stack.Navigator>
    </AuthProvider>
  );
}
