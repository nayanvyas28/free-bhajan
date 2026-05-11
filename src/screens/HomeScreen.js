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
  ScrollView,
  Alert
} from 'react-native';
import { Search, X, RefreshCcw, Mic } from 'lucide-react-native';
import { searchBhajans, getCuratedBhajans, getCategories, getDailyQuote } from '../services/youtubeApi';
import { saveFavorite, getFavorites, removeFavorite } from '../storage/favorites';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import VideoCard from '../components/VideoCard';
import Shimmer from '../components/SkeletonLoader';
import Header from '../components/Header';
import { usePlayer } from '../context/PlayerContext';
import { useLanguage } from '../context/LanguageContext';

const DEFAULT_CATEGORIES = [
  { name: "All", name_hi: "सभी" },
  { name: "Krishna", name_hi: "कृष्ण" },
  { name: "Shiv", name_hi: "शिव" },
  { name: "Ram", name_hi: "राम" },
  { name: "Ganesh", name_hi: "गणेश" },
  { name: "Devi", name_hi: "देवी" },
  { name: "Hanuman", name_hi: "हनुमान" }
];

const DIVINE_QUOTES = [
  { text: "The soul is neither born, nor does it ever die.", author: "Bhagavad Gita" },
  { text: "Change is the law of the universe. You can be a millionaire, or a pauper in an instant.", author: "Lord Krishna" },
  { text: "Set your heart upon your work, but never its reward.", author: "Bhagavad Gita" },
  { text: "When meditation is mastered, the mind is unwavering like the flame of a candle in a windless place.", author: "Lord Krishna" },
  { text: "A man is made by his belief. As he believes, so he is.", author: "Bhagavad Gita" },
  { text: "The power of God is with you at all times; through the activities of mind, senses, breathing, and emotions.", author: "Lord Krishna" },
  { text: "You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions.", author: "Lord Krishna" }
];

export default function HomeScreen({ navigation, route }) {
  const { theme, isDarkMode } = useTheme();
  const { t, language } = useLanguage();
  
  const SUB_TYPES = ["All", "Bhajan", "Mantra", "Aarti"];
  
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSubType, setActiveSubType] = useState("All");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [favIds, setFavIds] = useState([]);
  const [dailyQuote, setDailyQuote] = useState(null);
  const { playVideo } = usePlayer();

  const fetchDailyQuote = async () => {
    const quote = await getDailyQuote();
    if (quote) setDailyQuote(quote);
  };

  const fetchDeities = async () => {
    try {
      const data = await getCategories();
      if (data && data.length > 0) {
        setCategories([{ name: "All", name_hi: t('all') }, ...data]);
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
        data = await getCuratedBhajans(categoryParam, null, subTypeParam);
        // Fallback search removed - we want to show empty if no database data exists
      }
    } catch (err) {
      console.log("Load error in HomeScreen:", err);
    }
    
    // Filter out audio files, show only videos/youtube
    const videoOnlyData = (data || []).filter(item => item.type !== 'audio');
    setVideos(videoOnlyData);
    setLoading(false);
  };

  useEffect(() => {
    fetchDeities();
    fetchDailyQuote();
    loadVideos('', activeCategory, activeSubType);
    loadFavorites();
  }, []);

  useEffect(() => {
    if (route.params?.category) {
      const catName = typeof route.params.category === 'string' ? route.params.category : route.params.category.name;
      setActiveCategory(catName);
      setActiveSubType("All");
      setQuery('');
      loadVideos('', catName, "All");
    } else if (route.params?.searchQuery) {
      setQuery(route.params.searchQuery);
      setActiveCategory("All");
      setActiveSubType("All");
      loadVideos(route.params.searchQuery, "All", "All");
    }
  }, [route.params?.category, route.params?.searchQuery]);

  const clearSearch = () => {
    setQuery('');
    loadVideos('', activeCategory, activeSubType);
  };

  const handleCategoryPress = (cat) => {
    const catName = typeof cat === 'string' ? cat : cat.name;
    setActiveCategory(catName);
    setQuery('');
    loadVideos('', catName, activeSubType);
  };

  const handleSubTypePress = (subType) => {
    setActiveSubType(subType);
    setQuery('');
    loadVideos('', activeCategory, subType);
  };

  const loadFavorites = async () => {
    const favs = await getFavorites();
    setFavIds(favs.map(f => f.id?.videoId || f.id));
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadFavorites();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchDeities(), fetchDailyQuote(), loadVideos(query, activeCategory, activeSubType)]);
    setRefreshing(false);
  }, [query, activeCategory, activeSubType]);

  const toggleFavorite = async (video) => {
    const videoId = video.id?.videoId || video.id;
    if (favIds.includes(videoId)) {
      Alert.alert(
        t('removeFavoriteTitle') || 'Remove Favorite',
        t('removeFavoriteMessage') || 'Are you sure you want to remove this from your favorites?',
        [
          { text: t('cancel') || 'Cancel', style: 'cancel' },
          { 
            text: t('remove') || 'Remove', 
            style: 'destructive',
            onPress: async () => {
              await removeFavorite(videoId);
              setFavIds(favIds.filter(id => id !== videoId));
            }
          }
        ]
      );
    } else {
      await saveFavorite(video);
      setFavIds([...favIds, videoId]);
    }
  };

  const renderItem = ({ item }) => (
    <VideoCard
      video={item}
      isFav={favIds.includes(item.id?.videoId || item.id)}
      onFavorite={() => toggleFavorite(item)}
      onPress={() => {
        console.log("Video clicked:", item.title || item.snippet?.title);
        playVideo(item, videos);
      }}
    />
  );
  const renderHeader = () => {
    const today = new Date().getDate();
    // Fallback to static if DB is empty
    const displayQuote = dailyQuote ? {
      text: language === 'hi' ? dailyQuote.text_hi : dailyQuote.text_en,
      author: language === 'hi' ? dailyQuote.author_hi : dailyQuote.author_en
    } : DIVINE_QUOTES[today % DIVINE_QUOTES.length];

    return (
      <View>
        {!query && (
          <LinearGradient 
            colors={isDarkMode ? ['#1E293B', '#0F172A'] : ['#FFF8E1', '#FFF']} 
            style={styles.quoteCard}
          >
            <View style={styles.quoteIconArea}>
              <Text style={{ fontSize: 24 }}>✨</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.quoteTtl, { color: theme.primary }]}>{t('divineQuoteTitle')}</Text>
              <Text style={[styles.quoteText, { color: theme.text }]}>"{displayQuote.text}"</Text>
              <Text style={[styles.quoteAuthor, { color: theme.subtext }]}>— {displayQuote.author}</Text>
            </View>
          </LinearGradient>
        )}

        <View style={styles.filtersWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={typeof cat === 'string' ? cat : cat.id || cat.name}
                onPress={() => handleCategoryPress(cat)}
                style={[
                  styles.categoryChip,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  activeCategory === (typeof cat === 'string' ? cat : cat.name) && { backgroundColor: theme.primary, borderColor: theme.primary }
                ]}
              >
                <Text style={[styles.categoryText, { color: theme.subtext }, activeCategory === (typeof cat === 'string' ? cat : cat.name) && { color: '#FFF' }]}>
                  {language === 'hi' && cat.name_hi ? cat.name_hi : t(typeof cat === 'string' ? cat : cat.name)}
                </Text>
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
                <Text style={[styles.subTypeText, { color: theme.subtext }, activeSubType === type && { color: theme.primary }]}>{t(type)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title={t('devotional')} />
      
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Search size={20} color={theme.primary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => loadVideos(query, "All", "All")}
            placeholder={t('searchPlaceholder') || "Search for divine melodies..."}
            placeholderTextColor={theme.subtext}
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={clearSearch}>
              <X size={20} color={theme.subtext} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => Alert.alert("Voice Search", "Voice search is coming soon! 🙏")}>
              <Mic size={20} color={theme.subtext} />
            </TouchableOpacity>
          )}
        </View>
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
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.subtext }]}>{t('noData')}</Text>
              <TouchableOpacity 
                style={[styles.retryBtn, { backgroundColor: theme.primary }]}
                onPress={onRefresh}
              >
                <RefreshCcw size={18} color="#FFF" />
                <Text style={styles.retryText}>{t('retry')}</Text>
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
  quoteCard: {
    margin: 20,
    marginTop: 0,
    marginBottom: 24,
    padding: 20,
    borderRadius: 24,
    flexDirection: 'row',
    gap: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  quoteIconArea: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,179,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quoteTtl: {
    fontSize: 12,
    fontFamily: 'Outfit-Black',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  quoteText: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  quoteAuthor: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    marginTop: 8,
    opacity: 0.7,
  },
  listContent: { paddingTop: 8, paddingBottom: 100 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, fontFamily: 'Outfit-SemiBold', marginBottom: 16 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, elevation: 5 },
  retryText: { color: '#FFF', fontSize: 14, fontFamily: 'Outfit-Bold' }
});
