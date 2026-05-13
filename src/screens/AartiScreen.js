import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  ScrollView,
  Modal,
  Dimensions,
  Platform,
  TextInput
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { usePlayer } from '../context/PlayerContext';
import Header from '../components/Header';
import { getCuratedBhajans } from '../services/youtubeApi';
import { Play, BookOpen, X, Music, Flame, ChevronRight, Search } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function AartiScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, language } = useLanguage();
  const { playVideo, currentVideo } = usePlayer();
  const [aartis, setAartis] = useState([]);
  const [filteredAartis, setFilteredAartis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAarti, setSelectedAarti] = useState(null);
  const [lyricsFontSize, setLyricsFontSize] = useState(18);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAartis();
  }, []);

  const fetchAartis = async () => {
    setLoading(true);
    try {
      const data = await getCuratedBhajans(null, null, 'Aarti');
      const mappedData = data.map(item => ({...item, category: 'AARTI'}));
      setAartis(mappedData);
      setFilteredAartis(mappedData);
    } catch (e) {
      console.log('Error fetching aartis:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAartis(aartis);
    } else {
      const filtered = aartis.filter(item => 
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAartis(filtered);
    }
  }, [searchQuery, aartis]);

  const renderAartiItem = ({ item }) => {
    const videoId = item.id?.videoId || item.id;
    const isPlaying = (currentVideo?.id?.videoId || currentVideo?.id) === videoId;

    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: isPlaying ? theme.primary + '30' : theme.border }]}>
        <View style={styles.cardContent}>
          <View style={styles.thumbnailContainer}>
            <Image 
              source={{ uri: item.thumbnail || item.image_url || 'https://via.placeholder.com/150' }} 
              style={styles.thumbnail} 
            />
            {isPlaying && (
              <View style={[styles.playingOverlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            )}
          </View>
          <View style={styles.details}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.categoryBadge, { backgroundColor: theme.primary + '10' }]}>
                <Text style={[styles.categoryText, { color: theme.primary }]}>
                  {(item.category && item.category !== 'Bhajan') ? item.category : 'AARTI'}
                </Text>
              </View>
              {item.duration > 0 && (
                <Text style={[styles.duration, { color: theme.subtext }]}>
                  {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            activeOpacity={0.7}
            style={[styles.actionBtn, styles.playBtn, { backgroundColor: theme.primary }]}
            onPress={() => playVideo(item, aartis)}
          >
            <Play size={16} color="#000" fill="#000" />
            <Text style={[styles.btnText, { color: '#000' }]}>{t('play')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            activeOpacity={0.7}
            style={[styles.actionBtn, styles.readBtn, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: theme.border }]}
            onPress={() => setSelectedAarti(item)}
          >
            <BookOpen size={16} color={theme.text} />
            <Text style={[styles.btnText, { color: theme.text }]}>{t('read')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header />
      
      <FlatList
        data={filteredAartis}
        renderItem={renderAartiItem}
        keyExtractor={(item, index) => item.id?.videoId || item.id || index.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={styles.headerHero}>
            <LinearGradient
              colors={[theme.primary + '25', 'transparent']}
              style={styles.heroGradient}
            />
            <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Search size={20} color={theme.primary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder={t('searchPlaceholder') || 'Search Aarti...'}
                placeholderTextColor={theme.subtext}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={20} color={theme.subtext} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.heroSub, { color: theme.subtext, marginTop: 15 }]}>{t('aartiIntro')}</Text>
            <View style={[styles.divider, { backgroundColor: theme.primary + '20' }]} />
          </View>
        )}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Music size={48} color={theme.subtext} opacity={0.2} />
              <Text style={[styles.empty, { color: theme.subtext }]}>{t('noData')}</Text>
            </View>
          )
        }
        ListFooterComponent={<View style={{ height: 160 }} />}
      />

      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      )}

      {/* Lyrics Modal */}
      <Modal
        visible={!!selectedAarti}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedAarti(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalBar} />
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: theme.text }]} numberOfLines={1}>{selectedAarti?.title}</Text>
                <Text style={[styles.modalSub, { color: theme.primary }]}>{t('lyrics')}</Text>
              </View>
              
              <View style={styles.fontControls}>
                <TouchableOpacity 
                  onPress={() => setLyricsFontSize(Math.max(12, lyricsFontSize - 2))} 
                  style={[styles.fontBtn, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: theme.border }]}
                >
                  <Text style={{ color: theme.text, fontSize: 13, fontWeight: 'bold' }}>A-</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setLyricsFontSize(Math.min(32, lyricsFontSize + 2))} 
                  style={[styles.fontBtn, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: theme.border }]}
                >
                  <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>A+</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => setSelectedAarti(null)} style={[styles.closeBtn, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                <X size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              contentContainerStyle={styles.lyricsScroll}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.lyricsText, { color: theme.text, fontSize: lyricsFontSize, lineHeight: lyricsFontSize * 1.7 }]}>
                {selectedAarti?.description || t('lyricsNotAvailable')}
              </Text>
              <View style={{ height: 100 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerHero: {
    paddingTop: 5,
    paddingBottom: 15,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    height: 300,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: 'Outfit-Bold',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 15,
    fontFamily: 'Outfit-Medium',
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 10,
    lineHeight: 22,
  },
  divider: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 25,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 15,
    marginTop: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Outfit-Medium',
  },
  list: {
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 32,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  thumbnailContainer: {
    width: 70,
    height: 70,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
    marginLeft: 18,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: 'Outfit-Black',
    letterSpacing: 1,
  },
  duration: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    opacity: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  playBtn: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  readBtn: {
    borderWidth: 1,
  },
  btnText: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    gap: 15,
  },
  empty: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '85%',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 24,
    borderTopWidth: 1,
  },
  modalBar: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Outfit-Bold',
    marginBottom: 2,
  },
  modalSub: {
    fontSize: 12,
    fontFamily: 'Outfit-Black',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fontControls: { 
    flexDirection: 'row', 
    gap: 8, 
    marginRight: 12 
  },
  fontBtn: { 
    width: 42, 
    height: 42, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
  },
  closeBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lyricsScroll: {
    paddingHorizontal: 10,
  },
  lyricsText: {
    fontFamily: 'Outfit-Medium',
    textAlign: 'center',
    opacity: 0.9,
  },
});
