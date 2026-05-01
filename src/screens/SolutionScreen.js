import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';
import { getSolutions, getCategories } from '../services/youtubeApi';
import { Lightbulb, PlayCircle } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';

const DEFAULT_CATS = ['All', 'Health', 'Wealth', 'Job', 'Family', 'Peace', 'Mangal Dosh', 'Shani Dosh', 'Rahu Dosh', 'Kaal Sarp'];

export default function SolutionScreen() {
  const { theme } = useTheme();
  const { playVideo } = usePlayer();
  const [solutions, setSolutions] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATS);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

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
        const names = data.map(c => c.name);
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
        title: item.title,
        thumbnail: item.image_url
      });
    }
  };

  const renderSolution = ({ item }) => (
    <TouchableOpacity 
      activeOpacity={item.video_url ? 0.7 : 1}
      onPress={() => handleSolutionPress(item)}
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <Lightbulb size={20} color="#FFB300" />
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.category}</Text>
        </View>
      </View>

      {item.image_url && (
        <View style={styles.thumbnailContainer}>
          <Image source={{ uri: item.image_url }} style={styles.thumbnail} />
          {item.video_url && (
            <View style={styles.playOverlay}>
              <PlayCircle size={40} color="#FFF" />
            </View>
          )}
        </View>
      )}

      <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
      <Text style={[styles.description, { color: theme.subtext }]} numberOfLines={3}>
        {item.description}
      </Text>
      
      {item.video_url && (
        <View style={styles.videoIndicator}>
          <PlayCircle size={14} color={theme.primary} />
          <Text style={[styles.videoIndicatorText, { color: theme.primary }]}>Watch Video Solution</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Spiritual Solutions" />
      
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
              ]}>{cat}</Text>
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
            <Text style={styles.empty}>No solutions found in this category.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  catWrapper: { paddingVertical: 16 },
  catContent: { paddingHorizontal: 20, gap: 10 },
  catChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, borderWidth: 1 },
  catText: { fontSize: 14, fontFamily: 'Outfit-Bold' },
  list: { padding: 20, paddingBottom: 100 },
  card: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  iconBox: { backgroundColor: 'rgba(255,179,0,0.1)', borderRadius: 12, padding: 8 },
  badge: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { color: '#9CA3AF', fontSize: 10, fontFamily: 'Outfit-Black', letterSpacing: 1 },
  title: { fontSize: 18, fontFamily: 'Outfit-Bold', marginBottom: 8 },
  description: { fontSize: 14, fontFamily: 'Outfit-Medium', lineHeight: 20 },
  thumbnailContainer: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  videoIndicatorText: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
  },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: 40, color: '#6B7280', fontFamily: 'Outfit-Medium' }
});
