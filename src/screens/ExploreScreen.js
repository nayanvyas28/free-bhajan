import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions, ActivityIndicator, ScrollView, TextInput, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import ScreenWrapper from '../components/ScreenWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { getCategories, searchBhajans } from '../services/youtubeApi';
import { saveFavorite, getFavorites, removeFavorite } from '../storage/favorites';
import { Flower, Stars, Search, X, Calendar, BookOpen } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import VideoCard from '../components/VideoCard';

const { width } = Dimensions.get('window');

const DEFAULT_CATEGORIES = [
  { id: '1', name: 'Krishna', name_hi: 'कृष्ण', image_url: 'https://img.freepik.com/free-photo/view-divine-lord-krishna_23-2151127025.jpg', type: 'deity' },
  { id: '2', name: 'Shiv', name_hi: 'शिव', image_url: 'https://img.freepik.com/free-photo/lord-shiva-abstract-representation_23-2151048451.jpg', type: 'deity' },
  { id: '3', name: 'Ram', name_hi: 'राम', image_url: 'https://img.freepik.com/free-photo/view-divine-lord-rama_23-2151127027.jpg', type: 'deity' },
  { id: '4', name: 'Hanuman', name_hi: 'हनुमान', image_url: 'https://img.freepik.com/free-photo/view-divine-lord-hanuman_23-2151127019.jpg', type: 'deity' },
  { id: '5', name: 'Mangal Dosh', name_hi: 'मंगल दोष', image_url: 'https://img.freepik.com/free-photo/astrology-concept-with-planets_23-2149116174.jpg', type: 'dosh' },
  { id: '6', name: 'Shani Dosh', name_hi: 'शनि दोष', image_url: 'https://img.freepik.com/free-photo/astrology-concept-with-planets_23-2149116174.jpg', type: 'dosh' },
];

export default function ExploreScreen({ navigation }) {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const { profile } = useAuth();
  const { playVideo } = usePlayer();
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [favIds, setFavIds] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);

  useEffect(() => {
    loadCategories();
    loadFavorites();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      if (data && data.length > 0) {
        setCategories(data);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (e) {
      setCategories(DEFAULT_CATEGORIES);
    }
    setLoading(false);
  };

  const loadFavorites = async () => {
    const favs = await getFavorites();
    setFavIds(favs.map(f => f.id?.videoId || f.id));
  };

  const toggleFavorite = async (video) => {
    if (!profile) {
      navigation.navigate('Login');
      return;
    }
    const videoId = video.id?.videoId || video.id;
    if (favIds.includes(videoId)) {
      await removeFavorite(videoId);
      setFavIds(favIds.filter(id => id !== videoId));
    } else {
      await saveFavorite(video);
      setFavIds([...favIds, videoId]);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
    setLoading(true);
    setIsSearching(true);
    
    // 1. Search Categories locally
    const matchingCats = categories.filter(c => 
      c.name.toLowerCase().includes(query.toLowerCase()) || 
      (t(c.name) && t(c.name).toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredCategories(matchingCats);

    // 2. Search Videos via API/DB
    const results = await searchBhajans(query);
    setSearchResults(results);
    setLoading(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    setSearchResults([]);
    setFilteredCategories([]);
  };

  const renderSection = (type, title, icon) => {
    const filtered = categories.filter(c => (c.type || 'deity') === type);
    if (filtered.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          {icon}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
        </View>
        <View style={styles.grid}>
          {filtered.map((item) => (
            <TouchableOpacity 
              key={item.id || item.name}
              style={styles.card}
              onPress={() => navigation.navigate('HomeTab', { category: item.name })}
            >
              <Image source={{ uri: item.image_url }} style={styles.image} />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.overlay}
              >
                <Text style={styles.name}>{language === 'hi' && item.name_hi ? item.name_hi : t(item.name)}</Text>
                <Text style={styles.subtext}>{type === 'deity' ? t('devotionalSelection') : t('astrologicalGuide')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper hasTabBar={true}>
      <View style={[styles.container]}>
        <Header />
        
        <View style={styles.searchSection}>
          <View style={[styles.searchInputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Search size={20} color={theme.primary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => handleSearch(searchQuery)}
              placeholder={t('searchPlaceholder')}
              placeholderTextColor={theme.subtext}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <X size={20} color={theme.subtext} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {isSearching ? (
              <View style={styles.resultsContainer}>
                {filteredCategories.length > 0 && (
                  <View style={styles.catResults}>
                    <Text style={[styles.resultsTitle, { color: theme.text }]}>{t('suggestedCategories')}</Text>
                    <View style={styles.grid}>
                      {filteredCategories.map((item) => (
                        <TouchableOpacity 
                          key={item.id || item.name}
                          style={styles.card}
                          onPress={() => navigation.navigate('HomeTab', { category: item.name })}
                        >
                          <Image source={{ uri: item.image_url }} style={styles.image} />
                          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.overlay}>
                            <Text style={styles.name}>{language === 'hi' && item.name_hi ? item.name_hi : t(item.name)}</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <Text style={[styles.resultsTitle, { color: theme.text, marginTop: 20 }]}>
                  {searchResults.length > 0 ? `${t('searchResults')} (${searchResults.length})` : t('noResults')}
                </Text>
                {searchResults.map((item) => (
                  <VideoCard
                    key={item.id?.videoId || item.id || item.audioUrl}
                    video={item}
                    isFav={favIds.includes(item.id?.videoId || item.id)}
                    onFavorite={() => toggleFavorite(item)}
                    onPress={() => playVideo(item, searchResults)}
                  />
                ))}
              </View>
            ) : (
              <>
                {renderSection('deity', t('deities'), <Flower size={20} color="#FFB300" />)}
                
                {renderSection('dosh', t('kundliDosh'), <Stars size={20} color="#FFB300" />)}
              </>
            )}
          </ScrollView>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  searchInputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 20, 
    paddingHorizontal: 18, 
    height: 60, 
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchIcon: { marginRight: 15 },
  searchInput: { flex: 1, fontSize: 16, fontFamily: 'Outfit-Bold' },
  scrollContent: { padding: 16, paddingBottom: 150 },
  section: { marginBottom: 35 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginLeft: 8, marginBottom: 15 },
  sectionTitle: { fontSize: 26, fontFamily: 'Outfit-Bold', letterSpacing: -0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 4 },
  card: {
    width: (width - 60) / 2,
    marginBottom: 16,
    height: 180,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  image: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 16,
  },
  name: { color: '#FFF', fontSize: 18, fontFamily: 'Outfit-Bold', letterSpacing: -0.2 },
  subtext: { color: '#FFC107', fontSize: 9, fontFamily: 'Outfit-Black', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 4, opacity: 0.8 },
  resultsContainer: { paddingTop: 10 },
  resultsTitle: { 
    fontSize: 11, 
    fontFamily: 'Outfit-Black', 
    marginBottom: 20, 
    marginLeft: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.5
  },
  toolRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
  },
  toolCard: {
    flex: 1,
    height: 120,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.05)',
  },
  toolText: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    textAlign: 'center',
  },
});
