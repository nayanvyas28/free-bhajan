import React, { useEffect, useState, useCallback, memo } from 'react'; // Added memo
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
import { Search, X, RefreshCcw, Mic, Quote, User, Languages } from 'lucide-react-native';
import { searchBhajans, getCuratedBhajans, getCategories, getDailyQuote, getKathas, getBanners } from '../services/youtubeApi';
import { saveFavorite, getFavorites, removeFavorite } from '../storage/favorites';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import VideoCard from '../components/VideoCard';
import AdBanner from '../components/AdBanner';
import Shimmer from '../components/SkeletonLoader';
import Header from '../components/Header';
import ScreenWrapper from '../components/ScreenWrapper';
import { usePlayer } from '../context/PlayerContext';
import { useLanguage } from '../context/LanguageContext';
import { useSidebar } from '../context/SidebarContext';
import { useBanners } from '../context/BannerContext';

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
  { 
    text_en: "The soul is neither born, nor does it ever die.", 
    text_hi: "आत्मा न तो जन्म लेती है और न ही कभी मरती है।",
    author_en: "Bhagavad Gita",
    author_hi: "भगवद गीता"
  },
  { 
    text_en: "Change is the law of the universe. You can be a millionaire, or a pauper in an instant.", 
    text_hi: "परिवर्तन संसार का नियम है। आप एक पल में करोड़पति या कंगाल हो सकते हैं।",
    author_en: "Lord Krishna",
    author_hi: "भगवान कृष्ण"
  },
  { 
    text_en: "Set your heart upon your work, but never its reward.", 
    text_hi: "अपने कर्म पर अपना दिल लगाओ, लेकिन उसके फल पर कभी नहीं।",
    author_en: "Bhagavad Gita",
    author_hi: "भगवद गीता"
  },
  { 
    text_en: "When meditation is mastered, the mind is unwavering like the flame of a candle in a windless place.", 
    text_hi: "जब ध्यान सिद्ध हो जाता है, तो मन हवा रहित स्थान में मोमबत्ती की लौ की तरह अडिग रहता है।",
    author_en: "Lord Krishna",
    author_hi: "भगवान कृष्ण"
  },
  { 
    text_en: "A man is made by his belief. As he believes, so he is.", 
    text_hi: "मनुष्य अपने विश्वास से बनता है। जैसा वह विश्वास करता है, वैसा ही वह है।",
    author_en: "Bhagavad Gita",
    author_hi: "भगवद गीता"
  }
];

const HomeHeader = memo(({ 
  theme, isDarkMode, t, language, query, setQuery, loadVideos, 
  activeCategory, activeSubType, categories, 
  handleCategoryPress, handleSubTypePress, dailyQuote, DIVINE_QUOTES
}) => {
  const quoteData = dailyQuote || DIVINE_QUOTES[0];
  const displayQuote = {
    text: language === 'hi' ? quoteData.text_hi : quoteData.text_en,
    author: language === 'hi' ? quoteData.author_hi : quoteData.author_en
  };

  return (
    <View>
      {!query && (
        <>
          <View style={[styles.quoteCard, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#FFFFFF', borderColor: theme.border, elevation: 2, shadowColor: theme.shadow, shadowOpacity: 0.1, shadowRadius: 5 }]}>
            <LinearGradient
              colors={isDarkMode ? ['rgba(255,193,7,0.1)', 'rgba(255,193,7,0.02)'] : ['rgba(255,143,0,0.08)', 'rgba(255,143,0,0.01)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.quoteGradient}
            />
            <View style={[styles.quoteIconBox, { backgroundColor: isDarkMode ? 'rgba(255,193,7,0.1)' : 'rgba(255,143,0,0.15)' }]}>
              <Quote size={20} color={theme.primary} fill={theme.primary} fillOpacity={0.3} />
            </View>
            <View style={styles.quoteContent}>
              <Text style={[styles.quoteText, { color: theme.text, fontSize: 13 }]} numberOfLines={3}>"{displayQuote.text}"</Text>
              <Text style={[styles.quoteAuthor, { color: theme.primary, fontWeight: '700' }]}>— {displayQuote.author}</Text>
            </View>
          </View>
        </>
      )}

      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={typeof cat === 'string' ? cat : cat.id || cat.name}
              onPress={() => handleCategoryPress(cat)}
              style={[
                styles.categoryChip,
                { backgroundColor: theme.card, borderColor: 'rgba(255,255,255,0.05)' },
                activeCategory === (typeof cat === 'string' ? cat : cat.name) && { backgroundColor: theme.primary, borderColor: theme.primary }
              ]}
            >
              <Text style={[styles.categoryText, { color: theme.subtext }, activeCategory === (typeof cat === 'string' ? cat : cat.name) && { color: '#000' }]}>
                {language === 'hi' && cat.name_hi ? cat.name_hi : t(typeof cat === 'string' ? cat : cat.name)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filterRow, { marginTop: 15 }]}>
          {["All", "Bhajan", "Mantra", "Katha"].map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => handleSubTypePress(type)}
              style={[
                styles.subTypeChip,
                { backgroundColor: theme.surface, borderColor: 'rgba(255,255,255,0.05)' },
                activeSubType === type && { backgroundColor: 'rgba(255,193,7,0.1)', borderColor: theme.primary }
              ]}
            >
              <Text style={[styles.subTypeText, { color: theme.subtext }, activeSubType === type && { color: theme.primary }]}>{t(type)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
});

export default function HomeScreen({ navigation, route }) {
  const { theme, isDarkMode } = useTheme();
  const { t, language } = useLanguage();
  const { toggleSidebar } = useSidebar();
  
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSubType, setActiveSubType] = useState("All");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [favIds, setFavIds] = useState([]);
  const [dailyQuote, setDailyQuote] = useState(null);
  const { getBannersByPosition } = useBanners();
  const topBanners = getBannersByPosition('top');
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
      console.log('Error fetching deities:', e);
    }
  };

  const loadVideos = async (searchQuery = '', cat = 'All', subType = 'All') => {
    setLoading(true);
    try {
      let data = [];
      if (searchQuery) {
        data = await searchBhajans(searchQuery);
      } else if (subType === 'Katha') {
        // Fetch from dedicated kathas table + bhajans tagged as Katha
        const [bhajanKathas, dedicatedKathas] = await Promise.all([
          getCuratedBhajans(cat === 'All' ? null : cat, null, 'Katha'),
          getKathas()
        ]);
        data = [...bhajanKathas, ...dedicatedKathas];
      } else if (cat !== 'All') {
        data = await getCuratedBhajans(cat, null, subType === 'All' ? null : subType);
      } else if (subType !== 'All') {
        data = await getCuratedBhajans(null, null, subType);
      } else {
        data = await getCuratedBhajans(null, null, null);
      }

      // Filter out Aartis, Audio-only files, and Kathas (unless explicitly selected)
      const filteredData = (data || []).filter(item => {
        const isAarti = item.subType === 'Aarti' || item.title?.toLowerCase().includes('aarti') || item.title?.includes('आरती');
        const isAudio = item.type === 'audio';
        const isKatha = item.subType === 'Katha' || item.title?.toLowerCase().includes('katha') || item.title?.includes('कथा');
        
        // Always hide Aartis and Audio on Home
        if (isAarti || isAudio) return false;
        
        // Hide Kathas unless explicitly selected OR searching
        if (isKatha && subType !== 'Katha' && !searchQuery) return false;
        
        return true;
      });
      setVideos(filteredData);
    } catch (e) {
      console.log('Error loading videos:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeities();
    fetchDailyQuote();
    loadVideos();
  }, []);

  useEffect(() => {
    if (route.params?.category) {
      setActiveCategory(route.params.category);
      setActiveSubType("All");
      loadVideos('', route.params.category, "All");
    } else if (route.params?.searchQuery) {
      setQuery(route.params.searchQuery);
      setActiveCategory("All");
      setActiveSubType("All");
      loadVideos(route.params.searchQuery, "All", "All");
    }
  }, [route.params?.category, route.params?.searchQuery]);

  // Live Search & Category Effect (Debounced for Search)
  useEffect(() => {
    if (query.trim().length > 0) {
      const timer = setTimeout(() => {
        loadVideos(query, activeCategory, activeSubType);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      // Reload based on category/subtype when search is empty
      loadVideos('', activeCategory, activeSubType);
    }
  }, [query, activeCategory, activeSubType]);

  const clearSearch = () => {
    setQuery('');
  };

  const handleCategoryPress = useCallback((cat) => {
    const catName = typeof cat === 'string' ? cat : cat.name;
    setActiveCategory(catName);
    setQuery(''); // This will trigger the clearSearch logic in useEffect
  }, [activeSubType]);

  const handleSubTypePress = useCallback((subType) => {
    setActiveSubType(subType);
    setQuery(''); // This will trigger the clearSearch logic in useEffect
  }, [activeCategory]);

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
    await Promise.all([
      fetchDeities(), 
      fetchDailyQuote(), 
      loadVideos(query, activeCategory, activeSubType)
    ]);
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

  const renderItem = ({ item }) => {
    if (item.isShimmer) {
      return (
        <View style={{ marginBottom: 24, paddingHorizontal: 20 }}>
          <Shimmer style={{ height: 220, borderRadius: 24 }} />
          <View style={{ marginTop: 12, flexDirection: 'row', gap: 12 }}>
            <Shimmer style={{ width: 48, height: 48, borderRadius: 24 }} />
            <View style={{ flex: 1, gap: 8 }}>
              <Shimmer style={{ width: '80%', height: 20 }} />
              <Shimmer style={{ width: '40%', height: 16 }} />
            </View>
          </View>
        </View>
      );
    }

    return (
      <VideoCard
        video={item}
        isFav={favIds.includes(item.id?.videoId || item.id)}
        onFavorite={() => toggleFavorite(item)}
        onPress={() => {
          if (item.is_katha) {
            navigation.navigate('Katha', { kathaId: item.db_id || item.id, title: item.title });
          } else {
            console.log("Video clicked:", item.title || item.snippet?.title);
            playVideo(item, videos);
          }
        }}
      />
    );
  };

  const listData = (loading && !refreshing) 
    ? Array.from({ length: 3 }).map((_, i) => ({ id: `shimmer-${i}`, isShimmer: true }))
    : videos;

  return (
    <ScreenWrapper hasTabBar={true} showTopBanner={false}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Header />
        
        <View style={[styles.searchWrapper, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF', borderColor: theme.border }]}>
          <Search size={20} color={theme.primary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => loadVideos(query, activeCategory, activeSubType)}
            placeholder={t('searchPlaceholder') || "Search for divine melodies..."}
            placeholderTextColor={theme.subtext}
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={() => { setQuery(''); loadVideos('', activeCategory, activeSubType); }}>
              <X size={22} color={theme.subtext} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => Alert.alert("Voice Search", "Voice search is coming soon! 🙏")}>
              <Mic size={22} color={theme.subtext} />
            </TouchableOpacity>
          )}
        </View>

        <AdBanner banners={topBanners} />

        <FlatList
          data={listData}
          keyExtractor={(item, index) => (item.id?.videoId || item.id || index.toString())}
          renderItem={renderItem}
          ListHeaderComponent={
            <HomeHeader 
              theme={theme}
              isDarkMode={isDarkMode}
              t={t}
              language={language}
              query={query}
              setQuery={setQuery}
              loadVideos={loadVideos}
              activeCategory={activeCategory}
              activeSubType={activeSubType}
              categories={categories}
              handleCategoryPress={handleCategoryPress}
              handleSubTypePress={handleSubTypePress}
              dailyQuote={dailyQuote}
              DIVINE_QUOTES={DIVINE_QUOTES}
            />
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
          }
          ListEmptyComponent={
            !loading && (
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
            )
          }
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  headerTitle: { fontSize: 26, fontFamily: 'Outfit-Bold' },
  headerSub: { fontSize: 13, fontFamily: 'Outfit-Medium', opacity: 0.6 },
  refreshBtn: { 
    paddingHorizontal: 12,
    height: 44, 
    borderRadius: 14, 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
  },
  searchWrapper: {
    marginTop: 15,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 18,
    height: 60,
    borderWidth: 1,
  },
  searchIcon: { marginRight: 15 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
  },
  quoteCard: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 0,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  quoteGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  quoteIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,193,7,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  quoteContent: {
    flex: 1,
  },
  quoteText: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    lineHeight: 20,
    fontStyle: 'italic'
  },
  quoteAuthor: {
    fontSize: 10,
    fontFamily: 'Outfit-Black',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.5,
  },
  filtersWrapper: {
    paddingVertical: 2,
  },
  filterRow: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 0,
  },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
  },
  subTypeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  subTypeText: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    textTransform: 'uppercase',
  },
  listContent: { paddingBottom: 100 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyText: { fontSize: 16, fontFamily: 'Outfit-Bold', marginBottom: 20, textAlign: 'center', opacity: 0.5 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 25, paddingVertical: 14, borderRadius: 16, elevation: 5 },
  retryText: { color: '#FFF', fontSize: 14, fontFamily: 'Outfit-Bold' },
  floatingAdWrapper: {
    position: 'absolute',
    bottom: 65, // Just above the bottom nav bar
    left: 0,
    right: 0,
    zIndex: 99,
  },
  floatingBanner: {
    position: 'absolute',
    bottom: 65, // Tab bar height
    left: 0,
    right: 0,
    paddingTop: 10,
    paddingBottom: 0,
    backgroundColor: 'transparent',
    zIndex: 100,
  }
});
