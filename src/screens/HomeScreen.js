import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  FlatList, 
  TextInput, 
  StyleSheet, 
  ActivityIndicator, 
  Text,
  TouchableOpacity,
  RefreshControl,
  ScrollView
} from 'react-native';
import { Search, X, RefreshCcw } from 'lucide-react-native';
import { searchBhajans, getCuratedBhajans, getCategories } from '../services/youtubeApi';
import { saveFavorite, getFavorites, removeFavorite } from '../storage/favorites';
import { useTheme } from '../context/ThemeContext';
import VideoCard from '../components/VideoCard';
import Shimmer from '../components/SkeletonLoader';
import Header from '../components/Header';
import { usePlayer } from '../context/PlayerContext';

const DEFAULT_CATEGORIES = ["All", "Krishna", "Shiv", "Ram", "Ganesh", "Devi", "Hanuman"];
const SUB_TYPES = ["All", "Bhajan", "Mantra"];

export default function HomeScreen({ navigation, route }) {
  const { theme } = useTheme();
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSubType, setActiveSubType] = useState("All");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [favIds, setFavIds] = useState([]);
  const { playVideo } = usePlayer();

  const fetchDeities = async () => {
    try {
      const data = await getCategories();
      if (data && data.length > 0) {
        // Show "All" followed by all categories from DB (Deities + Dosh)
        const dbNames = data.map(c => c.name);
        setCategories(["All", ...dbNames]);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (e) {
      setCategories(DEFAULT_CATEGORIES);
    }
  };

  const loadVideos = async (searchQuery = '', category = "All", subType = "All") => {
    if (loading) return;
    setLoading(true);
    let data = [];
    
    try {
      if (searchQuery) {
        data = await searchBhajans(searchQuery);
        data = data.filter(v => v.type === 'youtube' || !v.type);
      } else {
        const categoryParam = category === "All" ? null : category;
        const subTypeParam = subType === "All" ? null : subType;
        data = await getCuratedBhajans(categoryParam, 'youtube', subTypeParam);
        // Fallback search removed - we want to show empty if no database data exists
      }
    } catch (err) {
      console.log("Load error in HomeScreen:", err);
    }
    
    setVideos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDeities();
    loadVideos('', activeCategory, activeSubType);
    loadFavorites();
  }, []);

  useEffect(() => {
    if (route.params?.category) {
      setActiveCategory(route.params.category);
      loadVideos('', route.params.category, activeSubType);
    }
  }, [route.params?.category]);

  const handleCategoryPress = (category) => {
    setActiveCategory(category);
    setQuery('');
    loadVideos('', category, activeSubType);
  };

  const handleSubTypePress = (subType) => {
    setActiveSubType(subType);
    setQuery('');
    loadVideos('', activeCategory, subType);
  };

  const loadFavorites = async () => {
    const favs = await getFavorites();
    setFavIds(favs.map(f => f.id.videoId));
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadFavorites();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDeities();
    await loadVideos(query, activeCategory, activeSubType);
    setRefreshing(false);
  }, [query, activeCategory, activeSubType]);

  const toggleFavorite = async (video) => {
    const videoId = video.id.videoId;
    if (favIds.includes(videoId)) {
      await removeFavorite(videoId);
      setFavIds(favIds.filter(id => id !== videoId));
    } else {
      await saveFavorite(video);
      setFavIds([...favIds, videoId]);
    }
  };

  const renderItem = ({ item }) => (
    <VideoCard
      video={item}
      isFav={favIds.includes(item.id.videoId)}
      onFavorite={() => toggleFavorite(item)}
      onPress={() => {
        console.log("Video clicked:", item.snippet?.title);
        playVideo(item, videos);
      }}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Devotional" />
      
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Search size={20} color={theme.primary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => loadVideos(query)}
            placeholder="Search for divine melodies..."
            placeholderTextColor={theme.subtext}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); loadVideos('', activeCategory, activeSubType); }}>
              <X size={20} color={theme.subtext} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => handleCategoryPress(cat)}
              style={[
                styles.categoryChip,
                { backgroundColor: theme.card, borderColor: theme.border },
                activeCategory === cat && { backgroundColor: theme.primary, borderColor: theme.primary }
              ]}
            >
              <Text style={[styles.categoryText, { color: theme.subtext }, activeCategory === cat && { color: '#FFF' }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filterRow, { marginTop: 10 }]}>
          {SUB_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => handleSubTypePress(type)}
              style={[
                styles.subTypeChip,
                { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: theme.border },
                activeSubType === type && { backgroundColor: 'rgba(255,179,0,0.1)', borderColor: theme.primary }
              ]}
            >
              <Text style={[styles.subTypeText, { color: theme.subtext }, activeSubType === type && { color: theme.primary }]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={{ padding: 20 }}>{[1, 2, 3].map((i) => (
            <View key={i} style={{ marginBottom: 24 }}>
              <Shimmer style={{ height: 220, borderRadius: 24 }} />
              <View style={{ marginTop: 12, flexDirection: 'row', gap: 12 }}>
                <Shimmer style={{ width: 48, height: 48, borderRadius: 24 }} />
                <View style={{ flex: 1, gap: 8 }}>
                  <Shimmer style={{ width: '80%', height: 20 }} />
                  <Shimmer style={{ width: '40%', height: 16 }} />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item, index) => (item.id?.videoId || item.id || index.toString())}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.subtext }]}>No content found.</Text>
              <TouchableOpacity 
                style={[styles.retryBtn, { backgroundColor: theme.primary }]}
                onPress={onRefresh}
              >
                <RefreshCcw size={18} color="#FFF" />
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: { padding: 20, paddingTop: 16, paddingBottom: 12 },
  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, fontFamily: 'Outfit-SemiBold' },
  filtersWrapper: { marginBottom: 16 },
  filterRow: { paddingHorizontal: 20, gap: 10 },
  categoryChip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  categoryText: { fontSize: 13, fontFamily: 'Outfit-Bold' },
  subTypeChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  subTypeText: { fontSize: 12, fontFamily: 'Outfit-SemiBold' },
  listContent: { paddingTop: 8, paddingBottom: 100 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, fontFamily: 'Outfit-SemiBold', marginBottom: 16 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, elevation: 5 },
  retryText: { color: '#FFF', fontSize: 14, fontFamily: 'Outfit-Bold' }
});
