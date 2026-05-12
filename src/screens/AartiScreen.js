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
  Modal
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { usePlayer } from '../context/PlayerContext';
import Header from '../components/Header';
import { getCuratedBhajans } from '../services/youtubeApi';
import { Play, BookOpen, X, Music, Flame } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AartiScreen() {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const { playVideo } = usePlayer();
  const [aartis, setAartis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAarti, setSelectedAarti] = useState(null);
  const [lyricsFontSize, setLyricsFontSize] = useState(18);

  useEffect(() => {
    fetchAartis();
  }, []);

  const fetchAartis = async () => {
    setLoading(true);
    try {
      // Fetch directly with subType 'Aarti'
      const data = await getCuratedBhajans(null, null, 'Aarti');
      setAartis(data);
    } catch (e) {
      console.log('Error fetching aartis:', e);
    } finally {
      setLoading(false);
    }
  };

  const renderAartiItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardContent}>
        <Image 
          source={{ uri: item.thumbnail || item.image_url || 'https://via.placeholder.com/150' }} 
          style={styles.thumbnail} 
        />
        <View style={styles.details}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>
            {(item.category && item.category !== 'Bhajan') ? item.category : 'Aarti'}
          </Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: theme.primary + '15' }]}
          onPress={() => playVideo(item)}
        >
          <Play size={18} color={theme.primary} fill={theme.primary} />
          <Text style={[styles.btnText, { color: theme.primary }]}>{t('play')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.05)' }]}
          onPress={() => setSelectedAarti(item)}
        >
          <BookOpen size={18} color={theme.subtext} />
          <Text style={[styles.btnText, { color: theme.subtext }]}>{t('read')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title={t('aarti') || 'Aarti'} />
      
      <View style={styles.intro}>
        <LinearGradient
          colors={[theme.primary + '20', 'transparent']}
          style={styles.introGradient}
        />
        <Flame size={32} color={theme.primary} />
        <Text style={[styles.introTitle, { color: theme.text }]}>{t('aartiSangrah') || 'Aarti Sangrah'}</Text>
        <Text style={[styles.introSub, { color: theme.subtext }]}>
          {t('aartiIntro') || 'Listen and read the divine aartis of deities.'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={aartis}
          renderItem={renderAartiItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.subtext }]}>{t('noData')}</Text>
          }
        />
      )}

      {/* Lyrics Modal */}
      <Modal
        visible={!!selectedAarti}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedAarti(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: theme.text }]} numberOfLines={1}>{selectedAarti?.title}</Text>
              </View>
              
              <View style={styles.fontControls}>
                <TouchableOpacity 
                  onPress={() => setLyricsFontSize(Math.max(12, lyricsFontSize - 2))} 
                  style={[styles.fontBtn, { backgroundColor: 'rgba(255,255,255,0.05)' }]}
                >
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: 'bold' }}>A-</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setLyricsFontSize(Math.min(32, lyricsFontSize + 2))} 
                  style={[styles.fontBtn, { backgroundColor: 'rgba(255,255,255,0.05)' }]}
                >
                  <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold' }}>A+</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => setSelectedAarti(null)} style={styles.closeBtn}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={styles.lyricsScroll}>
              <Text style={[styles.lyricsText, { color: theme.text, fontSize: lyricsFontSize }]}>
                {selectedAarti?.description || t('lyricsNotAvailable') || 'Lyrics not available for this Aarti.'}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  intro: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  introGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  introTitle: {
    fontSize: 24,
    fontFamily: 'Outfit-Bold',
    marginTop: 15,
    marginBottom: 8,
  },
  introSub: {
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
    textAlign: 'center',
    opacity: 0.6,
    paddingHorizontal: 20,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 150,
  },
  card: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: '#000',
  },
  details: {
    flex: 1,
    marginLeft: 15,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '80%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    flex: 1,
    marginRight: 10,
  },
  fontControls: { flexDirection: 'row', gap: 8, marginRight: 15 },
  fontBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lyricsScroll: {
    paddingBottom: 40,
  },
  lyricsText: {
    lineHeight: 28,
    fontFamily: 'Outfit-Medium',
    textAlign: 'center',
  },
});
