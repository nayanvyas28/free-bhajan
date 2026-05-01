import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions, ActivityIndicator, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';
import { LinearGradient } from 'expo-linear-gradient';
import { getCategories } from '../services/youtubeApi';
import { Flower, Stars } from 'lucide-react-native';

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
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      if (data && data.length > 0) {
        // Merge DB data with defaults (simplified: if DB has data, use it, else fallback)
        setCategories(data);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (e) {
      setCategories(DEFAULT_CATEGORIES);
    }
    setLoading(false);
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
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.subtext}>{type === 'deity' ? 'Devotional Selection' : 'Astrological Guide'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Explore divine" />
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderSection('deity', 'Devotional Deities', <Flower size={20} color="#FFB300" />)}
          {renderSection('dosh', 'Kundli Dosh Guidance', <Stars size={20} color="#FFB300" />)}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
});
