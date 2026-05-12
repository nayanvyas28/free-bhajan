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
import { Search, X, RefreshCcw, Mic, Quote, User, Languages } from 'lucide-react-native';
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

export default function HomeScreen({ navigation, route }) {
  const { theme, isDarkMode } = useTheme();
  const { t, language } = useLanguage();
  
  const SUB_TYPES = ["All", "Bhajan", "Mantra"];
  
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
  const { toggleLanguage } = useLanguage();

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
    
    // Filter out audio files and Aarti sub-type
    const videoOnlyData = (data || []).filter(item => 
      item.type !== 'audio' && item.subType !== 'Aarti'
    );
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
    const quoteData = dailyQuote || DIVINE_QUOTES[today % DIVINE_QUOTES.length];
    const displayQuote = {
      text: language === 'hi' ? quoteData.text_hi : quoteData.text_en,
      author: language === 'hi' ? quoteData.author_hi : quoteData.author_en
    };

    return (
      <View>
        <View style={styles.headerArea}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                {t('namaste')}
              </Text>
              <Text style={[styles.headerSub, { color: theme.subtext }]}>
                {t('spiritualLibrary')}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity 
                onPress={toggleLanguage}
                style={styles.refreshBtn}
              >
                <Languages size={20} color={theme.primary} />
                <Text style={{ color: theme.primary, fontSize: 10, fontFamily: 'Outfit-Bold', marginLeft: 4 }}>
                  {language.toUpperCase()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Profile')}
                style={styles.refreshBtn}
              >
                <User size={22} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.searchWrapper}>
          <Search size={22} color={theme.primary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
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

        {!query && (
          <View style={styles.quoteCard}>
            <LinearGradient
              colors={['rgba(255,193,7,0.1)', 'rgba(255,193,7,0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.quoteGradient}
            />
            <View style={styles.quoteIconBox}>
              <Quote size={18} color="#FFC107" fill="#FFC107" fillOpacity={0.2} />
            </View>
            <View style={styles.quoteContent}>
              <Text style={styles.quoteText} numberOfLines={3}>"{displayQuote.text}"</Text>
              <Text style={styles.quoteAuthor}>— {displayQuote.author}</Text>
            </View>
          </View>
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
            {SUB_TYPES.map((type) => (
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
  };
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {loading && !refreshing ? (
        <View style={{ padding: 20 }}>
          {[1, 2, 3].map((i) => (
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
    borderColor: 'rgba(255,255,255,0.05)'
  },
  searchWrapper: {
    marginTop: 15,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    paddingHorizontal: 18,
    height: 60,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchIcon: { marginRight: 15 },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
  },
  quoteCard: {
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 5,
    padding: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
    color: '#FFF',
    fontStyle: 'italic'
  },
  quoteAuthor: {
    fontSize: 10,
    fontFamily: 'Outfit-Black',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.5,
    color: '#FFF'
  },
  filtersWrapper: {
    paddingVertical: 5,
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
  listContent: { paddingBottom: 150 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyText: { fontSize: 16, fontFamily: 'Outfit-Bold', marginBottom: 20, textAlign: 'center', opacity: 0.5 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 25, paddingVertical: 14, borderRadius: 16, elevation: 5 },
  retryText: { color: '#FFF', fontSize: 14, fontFamily: 'Outfit-Bold' }
});
