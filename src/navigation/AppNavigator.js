import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Search, Lightbulb, Flame, Music, Languages, LayoutGrid } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { View, StyleSheet, Platform } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import SolutionScreen from '../screens/SolutionScreen';
import AartiScreen from '../screens/AartiScreen';
import AudioScreen from '../screens/AudioScreen';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AboutScreen from '../screens/AboutScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import CalendarScreen from '../screens/CalendarScreen';
import KathaScreen from '../screens/KathaScreen';
import { AuthProvider } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { theme } = useTheme();
  const { language, t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size, focused }) => {
          let icon;
          if (route.name === 'HomeTab') icon = <Home size={size} color={color} />;
          if (route.name === 'Explore') icon = <LayoutGrid size={size} color={color} />;
          if (route.name === 'Music') icon = <Music size={size} color={color} />;
          if (route.name === 'Solution') icon = <Lightbulb size={size} color={color} />;
          if (route.name === 'Aarti') icon = <Flame size={size} color={color} />;
          
          return (
            <View style={focused ? styles.iconContainerActive : styles.iconContainer}>
              {icon}
            </View>
          );
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.subtext,
        tabBarBackground: () => (
          <BlurView 
            intensity={Platform.OS === 'ios' ? 80 : 100} 
            tint="dark" 
            style={StyleSheet.absoluteFill} 
          />
        ),
        tabBarStyle: {
          position: 'absolute',
          bottom: 25,
          left: 20,
          right: 20,
          height: 70,
          backgroundColor: 'rgba(18, 18, 18, 0.9)',
          borderRadius: 30,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          paddingBottom: 10,
          paddingTop: 10,
          elevation: 5,
        },
        tabBarLabelStyle: {
          fontFamily: 'Outfit-Bold',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        }
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: t('home') }} />
      <Tab.Screen name="Explore" component={ExploreScreen} options={{ title: t('explore') }} />
      <Tab.Screen name="Music" component={AudioScreen} options={{ title: t('music') }} />
      <Tab.Screen name="Solution" component={SolutionScreen} options={{ title: t('solution') }} />
      <Tab.Screen name="Aarti" component={AartiScreen} options={{ title: t('aarti') || 'Aarti' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    padding: 4,
  },
  iconContainerActive: {
    padding: 4,
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  }
});

export default function AppNavigator() {
  return (
    <Stack.Navigator 
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="Audio" component={AudioScreen} />
      <Stack.Screen name="Katha" component={KathaScreen} />
      <Stack.Screen name="Settings" component={ProfileScreen} />
    </Stack.Navigator>
  );
}
