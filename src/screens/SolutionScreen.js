import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import Header from '../components/Header';
import { getSolutions, getCategories } from '../services/youtubeApi';
import { Lightbulb, PlayCircle } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';

const DEFAULT_CATS = ['All', 'Health', 'Wealth', 'Job', 'Family', 'Peace', 'Mangal Dosh', 'Shani Dosh', 'Rahu Dosh', 'Kaal Sarp'];
const DEITIES = ['Krishna', 'Shiv', 'Ram', 'Hanuman', 'Ganesha', 'Devi', 'Durga', 'Saraswati', 'Sai Baba', 'Laxmi', 'Mahadev'];

export default function SolutionScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { playVideo } = usePlayer();
  const [solutions, setSolutions] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATS);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    loadSolutions();
  }, [activeCategory]);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      if (data && data.length > 0) {
        const names = data
          .map(c => c.name)
          .filter(name => !DEITIES.some(d => d.toLowerCase() === name.toLowerCase()));
        
        setCategories([...new Set(['All', ...DEFAULT_CATS, ...names])]);
      }
    } catch (e) {}
  };

  const loadSolutions = async () => {
    setLoading(true);
    const cat = activeCategory === 'All' ? null : activeCategory;
    const data = await getSolutions(cat);
    setSolutions(data);
    setLoading(false);
  };

  const handleSolutionPress = (item) => {
    if (item.video_url) {
      playVideo({
        id: item.video_url,
        title: item.title || 'Spiritual Solution',
        thumbnail: item.image_url
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
          <View style={styles.iconBox}>
            <Lightbulb size={18} color={theme.primary} />
          </View>
          <View style={[styles.badge, { backgroundColor: theme.primary + '15' }]}>
            <Text style={[styles.badgeText, { color: theme.primary }]}>{t(item.category)}</Text>
          </View>
        </View>

        <View style={styles.contentRow}>
          {item.image_url && (
            <TouchableOpacity 
              style={styles.thumbnailWrapper}
              onPress={() => handleSolutionPress(item)}
            >
              <Image source={{ uri: item.image_url }} style={styles.thumbnail} />
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
              <Text style={[styles.readMore, { color: theme.primary }]}>Read More</Text>
            )}
          </View>
        </View>
        
        {item.video_url && (
          <TouchableOpacity 
            style={[styles.videoBtn, { backgroundColor: theme.primary + '10' }]}
            onPress={() => handleSolutionPress(item)}
          >
            <PlayCircle size={16} color={theme.primary} />
            <Text style={[styles.videoBtnText, { color: theme.primary }]}>{t('watchVideo')}</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title={t('solutionTitle') || 'Spiritual Solutions'} />
      
      <View style={styles.catWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catContent}>
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat} 
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.catChip, 
                { backgroundColor: theme.card, borderColor: theme.border },
                activeCategory === cat && { backgroundColor: theme.primary, borderColor: theme.primary }
              ]}
            >
              <Text style={[
                styles.catText, 
                { color: theme.subtext },
                activeCategory === cat && { color: '#FFF' }
              ]}>{t(cat)}</Text>
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
          data={solutions}
          renderItem={renderSolution}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.subtext }]}>{t('noData')}</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  catWrapper: { paddingVertical: 12 },
  catContent: { paddingHorizontal: 20, gap: 10 },
  catChip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  catText: { fontSize: 13, fontFamily: 'Outfit-Bold' },
  list: { padding: 16, paddingBottom: 100 },
  card: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  iconBox: { borderRadius: 10, padding: 6 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontFamily: 'Outfit-Black', letterSpacing: 0.5, textTransform: 'uppercase' },
  contentRow: { flexDirection: 'row', gap: 14 },
  thumbnailWrapper: {
    width: 100,
    height: 100,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: { width: '100%', height: '100%', backgroundColor: '#000' },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: { flex: 1, gap: 4 },
  title: { fontSize: 16, fontFamily: 'Outfit-Bold', lineHeight: 22 },
  description: { fontSize: 13, fontFamily: 'Outfit-Medium', lineHeight: 18 },
  readMore: { fontSize: 12, fontFamily: 'Outfit-Bold', marginTop: 4 },
  videoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    height: 44,
    borderRadius: 12,
  },
  videoBtnText: { fontSize: 13, fontFamily: 'Outfit-Bold' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 15, fontFamily: 'Outfit-Medium' }
});
