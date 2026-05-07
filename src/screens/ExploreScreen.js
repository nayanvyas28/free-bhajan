import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import Header from '../components/Header';
import { LinearGradient } from 'expo-linear-gradient';
import { getCategories, searchBhajans } from '../services/youtubeApi';
import { saveFavorite, getFavorites, removeFavorite } from '../storage/favorites';
import { Flower, Stars, Search, X } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import VideoCard from '../components/VideoCard';

const { width } = Dimensions.get('window');

const DEFAULT_CATEGORIES = [
  { id: '1', name: 'Krishna', image_url: 'https://img.freepik.com/free-photo/view-divine-lord-krishna_23-2151127025.jpg', type: 'deity' },
  { id: '2', name: 'Shiv', image_url: 'https://img.freepik.com/free-photo/lord-shiva-abstract-representation_23-2151048451.jpg', type: 'deity' },
  { id: '3', name: 'Ram', image_url: 'https://img.freepik.com/free-photo/view-divine-lord-rama_23-2151127027.jpg', type: 'deity' },
  { id: '4', name: 'Hanuman', image_url: 'https://img.freepik.com/free-photo/view-divine-lord-hanuman_23-2151127019.jpg', type: 'deity' },
  { id: '5', name: 'Mangal Dosh', image_url: 'https://img.freepik.com/free-photo/astrology-concept-with-planets_23-2149116174.jpg', type: 'dosh' },
  { id: '6', name: 'Shani Dosh', image_url: 'https://img.freepik.com/free-photo/astrology-concept-with-planets_23-2149116174.jpg', type: 'dosh' },
];

export default function ExploreScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { playVideo } = usePlayer();
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [favIds, setFavIds] = useState([]);

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

  const [filteredCategories, setFilteredCategories] = useState([]);

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
                <Text style={styles.name}>{t(item.name)}</Text>
                <Text style={styles.subtext}>{type === 'deity' ? t('devotionalSelection') : t('astrologicalGuide')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
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
                          <Text style={styles.name}>{t(item.name)}</Text>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchSection: { padding: 20, paddingTop: 16, paddingBottom: 10 },
  searchInputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    height: 56, 
    borderWidth: 1 
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, fontFamily: 'Outfit-SemiBold' },
  scrollContent: { padding: 12, paddingBottom: 100 },
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 22, fontFamily: 'Outfit-Bold', letterSpacing: -0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  card: {
    width: (width - 48) / 2,
    margin: 6,
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1E1E26',
    elevation: 5,
  },
  image: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 16,
  },
  name: { color: '#FFF', fontSize: 18, fontFamily: 'Outfit-Bold', letterSpacing: 0.5 },
  subtext: { color: '#FFB300', fontSize: 10, fontFamily: 'Outfit-Black', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  resultsContainer: { paddingTop: 20 },
  resultsTitle: { 
    fontSize: 12, 
    fontFamily: 'Outfit-Black', 
    marginBottom: 20, 
    marginLeft: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.8
  },
});
