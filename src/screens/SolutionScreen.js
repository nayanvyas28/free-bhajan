import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, ActivityIndicator, Image, TextInput } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import Header from '../components/Header';
import ScreenWrapper from '../components/ScreenWrapper';
import { getSolutions, getCategories } from '../services/youtubeApi';
import { Lightbulb, PlayCircle, Video, Music, Heart, Search, X } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { saveFavorite, getFavorites, removeFavorite } from '../storage/favorites';
import { Alert } from 'react-native';

export default function SolutionScreen() {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const { playVideo } = usePlayer();
  const [solutions, setSolutions] = useState([]);
  const [categories, setCategories] = useState([{ name: 'All', name_hi: 'सभी' }]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeType, setActiveType] = useState('video'); // 'video' or 'audio'
  const [expandedId, setExpandedId] = useState(null);
  const [favIds, setFavIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSolutions, setFilteredSolutions] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    loadSolutions();
    loadFavorites();
  }, [activeCategory, activeType]);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      if (data && data.length > 0) {
        // Only show categories of type 'solution' or 'dosh'
        const solutionCats = data
          .filter(c => c.type === 'solution' || c.type === 'dosh');
        
        setCategories([{ name: 'All', name_hi: t('all') }, ...solutionCats]);
      }
    } catch (e) {}
  };

  const loadSolutions = async () => {
    setLoading(true);
    const cat = activeCategory === 'All' ? null : activeCategory;
    const data = await getSolutions(cat, activeType);
    setSolutions(data);
    setFilteredSolutions(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSolutions(solutions);
    } else {
      const filtered = solutions.filter(item => 
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSolutions(filtered);
    }
  }, [searchQuery, solutions]);

  const loadFavorites = async () => {
    const favs = await getFavorites();
    setFavIds(favs.map(f => f.id?.videoId || f.id));
  };

  const toggleFavorite = async (item) => {
    const videoId = item.id?.videoId || item.id;
    const isFav = favIds.includes(videoId);

    if (isFav) {
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
              loadFavorites();
            }
          }
        ]
      );
    } else {
      await saveFavorite(item);
      loadFavorites();
    }
  };

  const handleSolutionPress = (item) => {
    const finalUrl = item.url || item.video_url;
    if (finalUrl) {
      playVideo({
        id: finalUrl,
        title: item.title || 'Spiritual Solution',
        thumbnail: item.image_url,
        type: item.type || 'video',
        duration: item.duration || 0
      });
    }
  };

  const renderSolution = ({ item }) => {
    const isExpanded = expandedId === item.id;
    
    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.iconBox}>
              <Lightbulb size={18} color={theme.primary} />
            </View>
            <View style={[styles.badge, { backgroundColor: theme.primary + '15' }]}>
              <Text style={[styles.badgeText, { color: theme.primary }]}>{t(item.category)}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.heartBtn} 
            onPress={() => toggleFavorite(item)}
          >
            <Heart 
              size={22} 
              color={favIds.includes(item.id?.videoId || item.id) ? '#FF4B4B' : theme.subtext} 
              fill={favIds.includes(item.id?.videoId || item.id) ? '#FF4B4B' : 'transparent'} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.contentRow}>
          {item.image_url && (
            <TouchableOpacity 
              style={styles.thumbnailWrapper}
              onPress={() => handleSolutionPress(item)}
            >
              <Image source={{ uri: item.image_url }} style={styles.thumbnail} resizeMode="cover" />
              <View style={styles.playOverlay}>
                <PlayCircle size={24} color="#FFF" />
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
              {item.title}
            </Text>
            <Text 
              style={[styles.description, { color: theme.subtext }]} 
              numberOfLines={isExpanded ? undefined : 2}
            >
              {item.description}
            </Text>
            {!isExpanded && item.description?.length > 60 && (
              <Text style={[styles.readMore, { color: theme.primary }]}>{t('readMore')}</Text>
            )}
          </View>
        </View>
        
        {(item.url || item.video_url) && (
          <TouchableOpacity 
            style={[styles.videoBtn, { backgroundColor: theme.primary + '10' }]}
            onPress={() => handleSolutionPress(item)}
          >
            <PlayCircle size={16} color={theme.primary} />
            <Text style={[styles.videoBtnText, { color: theme.primary }]}>
              {item.type === 'audio' ? t('upayeAudio') : t('watchVideo')}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper hasTabBar={true}>
      <View style={[styles.container]}>
        <Header title={t('solutionTitle') || 'Spiritual Solutions'} />
        
        <View style={styles.searchSection}>
          <View style={[styles.searchInputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Search size={20} color={theme.primary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('searchPlaceholder')}
              placeholderTextColor={theme.subtext}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={20} color={theme.subtext} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <View style={styles.typeTabs}>
          {[
            { id: 'video', label: t('upayeVideo'), icon: Video },
            { id: 'audio', label: t('upayeAudio'), icon: Music }
          ].map(tab => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => {
                setActiveType(tab.id);
                setExpandedId(null);
              }}
              style={[
                styles.typeTab,
                activeType === tab.id && { backgroundColor: theme.primary + '20' }
              ]}
            >
              <Text style={[
                styles.typeTabText,
                { color: theme.subtext },
                activeType === tab.id && { color: theme.primary, fontFamily: 'Outfit-Black' }
              ]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.catWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catContent}>
            {categories.map(cat => (
              <TouchableOpacity 
                key={cat.id || cat.name} 
                onPress={() => setActiveCategory(cat.name)}
                style={[
                  styles.catChip, 
                  { backgroundColor: theme.card, borderColor: theme.border },
                  activeCategory === cat.name && { backgroundColor: theme.primary, borderColor: theme.primary }
                ]}
              >
                <Text style={[
                  styles.catText, 
                  { color: theme.subtext },
                  activeCategory === cat.name && { color: '#FFF' }
                ]}>
                  {language === 'hi' && cat.name_hi ? cat.name_hi : t(cat.name)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredSolutions}
            renderItem={renderSolution}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: theme.subtext }]}>{t('noData')}</Text>
            }
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchSection: { paddingHorizontal: 20, paddingTop: 10, marginBottom: 5 },
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
  typeTabs: { 
    flexDirection: 'row', 
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  typeTab: { 
    flex: 1, 
    height: 44, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderRadius: 14,
  },
  typeTabText: { fontSize: 12, fontFamily: 'Outfit-Bold', letterSpacing: 0.5, textTransform: 'uppercase' },
  catWrapper: { paddingVertical: 10 },
  catContent: { paddingHorizontal: 20, gap: 10 },
  catChip: { 
    paddingHorizontal: 18, 
    paddingVertical: 10, 
    borderRadius: 14, 
    borderWidth: 1 
  },
  catText: { fontSize: 13, fontFamily: 'Outfit-Bold' },
  list: { paddingHorizontal: 20, paddingBottom: 150 },
  card: {
    padding: 16,
    borderRadius: 28,
    marginBottom: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heartBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBox: { borderRadius: 8, padding: 6, backgroundColor: 'rgba(255,193,7,0.1)' },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(255,193,7,0.05)' },
  badgeText: { fontSize: 9, fontFamily: 'Outfit-Black', letterSpacing: 1, textTransform: 'uppercase' },
  contentRow: { flexDirection: 'row', gap: 12 },
  thumbnailWrapper: {
    width: 90,
    height: 90,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000'
  },
  thumbnail: { 
    width: '100%', 
    height: '100%', 
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: { flex: 1, gap: 4 },
  title: { fontSize: 15, fontFamily: 'Outfit-Bold', lineHeight: 20, color: '#FFF' },
  description: { fontSize: 12, fontFamily: 'Outfit-Medium', lineHeight: 18, opacity: 0.5, color: '#FFF' },
  readMore: { fontSize: 11, fontFamily: 'Outfit-Bold', marginTop: 2 },
  videoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 15,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(255,193,7,0.05)',
    borderColor: 'rgba(255,193,7,0.1)',
  },
  videoBtnText: { fontSize: 12, fontFamily: 'Outfit-Bold', letterSpacing: 0.5 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: 60, fontSize: 15, fontFamily: 'Outfit-Bold', opacity: 0.2 }
});
