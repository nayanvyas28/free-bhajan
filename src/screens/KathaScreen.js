import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  Image,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import Header from '../components/Header';
import ScreenWrapper from '../components/ScreenWrapper';
import { BookOpen, Minus, Plus, Type, Share2, Heart, Loader2, Play, Video as VideoIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../storage/supabase';
import { usePlayer } from '../context/PlayerContext';

const { width, height } = Dimensions.get('window');

const KATHA_DATA = {
  ekadashi_katha: {
    title: 'Mohini Ekadashi Vrat Katha',
    title_hi: 'मोहिनी एकादशी व्रत कथा',
    content: `Once upon a time, there was a beautiful city named Bhadravati on the banks of the river Saraswati. King Dyutiman ruled this city. He was a pious and truthful king. He had five sons. The youngest son, Dhrishtabuddhi, was very sinful and wasted his father's wealth on bad habits.

Frustrated, the king disowned him. Dhrishtabuddhi wandered into the forest and met Sage Kaundinya. He repented for his sins and asked for a way to achieve salvation. The sage advised him to observe the Mohini Ekadashi Vrat.

Dhrishtabuddhi observed the fast with full devotion. By the merit of this fast, all his sins were washed away, and he eventually attained the divine abode of Lord Vishnu.`,
    content_hi: `प्राचीन काल में सरस्वती नदी के तट पर भद्रावती नाम की एक सुंदर नगरी थी। वहाँ द्युतिमान नामक राजा राज्य करता था। वह बड़ा ही धर्मात्मा और सत्यवादी था। उसके पाँच पुत्र थे। उसका सबसे छोटा पुत्र धृष्टबुद्धि अत्यंत पापी और दुराचारी था।

राजा ने उसे अपनी संपत्ति से बेदखल कर दिया। धृष्टबुद्धि वन में भटकने लगा और महर्षि कौण्डिन्य से मिला। उसने अपने पापों का प्रायश्चित किया और मुक्ति का मार्ग पूछा। ऋषि ने उसे मोहिनी एकादशी का व्रत करने की सलाह दी।

धृष्टबुद्धि ने पूर्ण भक्ति के साथ व्रत किया। इस व्रत के पुण्य से उसके सभी पाप धुल गए और अंत में उसे भगवान विष्णु के परम धाम की प्राप्ति हुई।`,
    image: 'https://img.freepik.com/free-photo/view-divine-lord-vishnu_23-2151127025.jpg'
  },
  pradosh_katha: {
    title: 'Pradosh Vrat Katha',
    title_hi: 'प्रदोष व्रत कथा',
    content: `Pradosh Vrat is dedicated to Lord Shiva. Legend has it that during the churning of the ocean (Samudra Manthan), a deadly poison (Halahala) emerged. To save the universe, Lord Shiva consumed the poison on the day of Trayodashi during the Pradosh period (twilight).

The gods and goddesses sang praises of Lord Shiva. Observing this fast brings health, wealth, and spiritual growth. It is said that Lord Shiva and Goddess Parvati are extremely happy during this time and bless their devotees generously.`,
    content_hi: `प्रदोष व्रत भगवान शिव को समर्पित है। पौराणिक कथा के अनुसार, समुद्र मंथन के दौरान हलाहल विष निकला था। ब्रह्मांड को बचाने के लिए, भगवान शिव ने त्रयोदशी के दिन प्रदोष काल (संध्याकाल) में विष का पान किया था।

सभी देवी-देवताओं ने भगवान शिव की स्तुति की। इस व्रत को करने से स्वास्थ्य, धन और आध्यात्मिक उन्नति प्राप्त होती है। कहा जाता है कि इस समय भगवान शिव और माता पार्वती अत्यंत प्रसन्न होते हैं और अपने भक्तों को उदारतापूर्वक आशीर्वाद देते हैं।`,
    image: 'https://img.freepik.com/free-photo/lord-shiva-abstract-representation_23-2151048451.jpg'
  }
};

export default function KathaScreen({ route, navigation }) {
  const { kathaId } = route.params || { kathaId: 'ekadashi_katha' };
  const { theme, isDarkMode } = useTheme();
  const { t, language } = useLanguage();
  const [fontSize, setFontSize] = useState(18);
  const [katha, setKatha] = useState(null);
  const [loading, setLoading] = useState(true);
  const { playVideo } = usePlayer();

  useEffect(() => {
    fetchKatha();
  }, [kathaId]);

  const fetchKatha = async () => {
    setLoading(true);
    // Check if kathaId is a UUID, static key, or 'latest'
    if (kathaId === 'latest') {
      try {
        const { data, error } = await supabase
          .from('kathas')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);
        
        const singleData = data && data.length > 0 ? data[0] : null;
        if (singleData) {
          setKatha({
            ...singleData,
            image: singleData.image_url,
            duration: singleData.duration || 0
          });
        } else {
          setKatha(KATHA_DATA['ekadashi_katha']);
        }
      } catch (err) {
        setKatha(KATHA_DATA['ekadashi_katha']);
      }
    } else if (kathaId.length > 20) {
      try {
        const { data, error } = await supabase
          .from('kathas')
          .select('*')
          .eq('id', kathaId);
        
        const singleData = data && data.length > 0 ? data[0] : null;
        
        if (singleData) {
          setKatha({
            ...singleData,
            image: singleData.image_url,
            duration: singleData.duration || 0
          });
        } else {
          setKatha(KATHA_DATA['ekadashi_katha']);
        }
      } catch (err) {
        console.log("Katha fetch error:", err);
        setKatha(KATHA_DATA['ekadashi_katha']);
      }
    } else {
      setKatha(KATHA_DATA[kathaId] || KATHA_DATA['ekadashi_katha']);
    }
    setLoading(false);
  };

  if (loading || !katha) {
    return (
      <ScreenWrapper>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Loader2 color={theme.primary} size={40} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper hasTabBar={false}>
      <View style={[styles.container]}>
        <Header customTitle={language === 'hi' ? 'व्रत कथा' : 'Vrat Katha'} />
        
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: katha.image }} style={styles.image} />
            {katha.video_url && (
              <TouchableOpacity 
                style={[styles.playButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  const normalizedKatha = {
                    ...katha,
                    id: katha.id,
                    title: language === 'hi' ? katha.title_hi : katha.title,
                    thumbnail: katha.image,
                    image_url: katha.image,
                    url: katha.video_url,
                    video_url: katha.video_url,
                    type: (katha.video_url.includes('youtube') || katha.video_url.includes('youtu.be')) ? 'youtube' : 'video'
                  };
                  playVideo(normalizedKatha, [normalizedKatha]);
                }}
              >
                <Play size={24} color="#000" fill="#000" />
              </TouchableOpacity>
            )}
            <LinearGradient
              colors={['transparent', theme.background]}
              style={styles.imageOverlay}
            />
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: theme.text }]}>
                  {language === 'hi' ? katha.title_hi : katha.title}
                </Text>
                <View style={styles.metaRow}>
                  <BookOpen size={14} color={theme.primary} />
                  <Text style={[styles.metaText, { color: theme.primary }]}>Sacred Story</Text>
                </View>
              </View>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.card }]}>
                <Heart size={20} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* FONT CONTROLS */}
            <View style={[styles.fontCard, { backgroundColor: theme.card }]}>
              <TouchableOpacity onPress={() => setFontSize(prev => Math.max(12, prev - 2))} style={styles.fontBtn}>
                <Minus size={16} color={theme.text} />
              </TouchableOpacity>
              <Type size={20} color={theme.primary} />
              <TouchableOpacity onPress={() => setFontSize(prev => Math.min(32, prev + 2))} style={styles.fontBtn}>
                <Plus size={16} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.kathaBox}>
              <Text style={[styles.kathaText, { color: theme.text, fontSize, lineHeight: fontSize * 1.6 }]}>
                {language === 'hi' ? katha.content_hi : katha.content}
              </Text>
            </View>

            <TouchableOpacity style={[styles.shareBtn, { backgroundColor: theme.primary }]}>
              <Share2 size={20} color="#000" />
              <Text style={styles.shareBtnText}>Share this Katha</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  imageContainer: { width: width, height: 300, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imageOverlay: { ...StyleSheet.absoluteFillObject },
  contentContainer: { padding: 24, marginTop: -40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 24, fontFamily: 'Outfit-Bold', flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  metaText: { fontSize: 12, fontFamily: 'Outfit-Black', textTransform: 'uppercase', letterSpacing: 1 },
  actionBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  divider: { height: 1, marginVertical: 20, opacity: 0.2 },
  fontCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 20, 
    padding: 10, 
    borderRadius: 20,
    marginBottom: 24,
  },
  fontBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  kathaBox: { marginBottom: 40 },
  kathaText: { fontFamily: 'Outfit-Medium', textAlign: 'justify' },
  shareBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 12, 
    padding: 18, 
    borderRadius: 20,
    marginBottom: 40,
    elevation: 10,
  },
  shareBtnText: { fontSize: 16, fontFamily: 'Outfit-Bold', color: '#000' },
  playButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 10,
  },
});
