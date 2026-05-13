import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  FlatList
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import { useSidebar } from '../context/SidebarContext';
import Header from '../components/Header';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Bell, Info, BookOpen } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCalendarEvents } from '../services/youtubeApi';

const { width } = Dimensions.get('window');

export default function CalendarScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, language, toggleLanguage } = useLanguage();
  const { toggleSidebar } = useSidebar();
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const data = await getCalendarEvents();
    setEvents(data);
    setLoading(false);
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const months_hi = [
    "जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून",
    "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"
  ];

  const renderFestivalItem = ({ item }) => (
    <View style={[styles.eventCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.eventDateBox, { backgroundColor: theme.primary + '15' }]}>
        <Text style={[styles.eventDay, { color: theme.primary }]}>{item.event_date.split('-')[2]}</Text>
        <Text style={[styles.eventMonth, { color: theme.primary }]}>{months[parseInt(item.event_date.split('-')[1]) - 1].substring(0, 3)}</Text>
      </View>
      <View style={styles.eventInfo}>
        <Text style={[styles.eventTitle, { color: theme.text }]}>{language === 'hi' ? item.title_hi : item.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Text style={[styles.eventVedic, { color: theme.primary }]}>{item.tithi} • {item.paksha} Paksha</Text>
        </View>
      </View>
      {item.katha_id ? (
        <TouchableOpacity 
          style={[styles.kathaBtn, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('Katha', { kathaId: item.katha_id, title: item.title })}
        >
          <BookOpen size={16} color="#000" />
          <Text style={styles.kathaBtnText}>Katha</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.notifyBtn}>
          <Bell size={20} color={theme.primary} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header customTitle={t('calendar') || 'Spiritual Calendar'} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* MONTH HEADER */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity style={styles.navBtn}>
            <ChevronLeft color={theme.text} size={24} />
          </TouchableOpacity>
          <View style={styles.monthTitleBox}>
            <Text style={[styles.monthText, { color: theme.text }]}>
              {language === 'hi' ? months_hi[selectedDate.getMonth()] : months[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </Text>
            <Text style={[styles.hindiMonth, { color: theme.primary }]}>Vaishakha - Jyeshtha</Text>
          </View>
          <TouchableOpacity style={styles.navBtn}>
            <ChevronRight color={theme.text} size={24} />
          </TouchableOpacity>
        </View>

        {/* CALENDAR PLACEHOLDER GRID */}
        <View style={[styles.calendarGrid, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.weekRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <Text key={i} style={[styles.weekDay, { color: theme.subtext }]}>{day}</Text>
            ))}
          </View>
          <View style={styles.daysGrid}>
            {/* Simple static grid for demo */}
            {Array.from({ length: 31 }).map((_, i) => (
              <TouchableOpacity 
                key={i} 
                style={[
                  styles.dayCell, 
                  (i + 1 === 15 || i + 1 === 22) && { backgroundColor: theme.primary + '20', borderRadius: 12 }
                ]}
              >
                <Text style={[styles.dayText, { color: theme.text }, (i + 1 === 15 || i + 1 === 22) && { color: theme.primary, fontFamily: 'Outfit-Bold' }]}>
                  {i + 1}
                </Text>
                {(i + 1 === 15 || i + 1 === 22) && <View style={[styles.dot, { backgroundColor: theme.primary }]} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* UPCOMING EVENTS */}
        <View style={styles.eventsSection}>
          <View style={styles.sectionHeader}>
            <CalendarIcon size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('upcomingFestivals') || 'Upcoming Festivals'}</Text>
          </View>
          
          <FlatList
            data={events}
            renderItem={renderFestivalItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
          />
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.primary + '08', borderColor: theme.primary + '20' }]}>
          <Info size={20} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.text }]}>
            Panchang details are updated daily based on Hindu Lunar Calendar.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 120 },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  monthTitleBox: { alignItems: 'center' },
  monthText: { fontSize: 22, fontFamily: 'Outfit-Bold' },
  hindiMonth: { fontSize: 12, fontFamily: 'Outfit-Black', textTransform: 'uppercase', marginTop: 4, letterSpacing: 1 },
  navBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  
  calendarGrid: {
    marginHorizontal: 20,
    borderRadius: 32,
    padding: 20,
    borderWidth: 1,
  },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
  weekDay: { fontSize: 13, fontFamily: 'Outfit-Bold', width: 40, textAlign: 'center' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  dayCell: { width: (width - 80) / 7, height: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  dayText: { fontSize: 15, fontFamily: 'Outfit-Medium' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 4 },
  
  eventsSection: { paddingHorizontal: 20, marginTop: 30 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontFamily: 'Outfit-Black', textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.8 },
  
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
  },
  eventDateBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  eventDay: { fontSize: 18, fontFamily: 'Outfit-Bold' },
  eventMonth: { fontSize: 10, fontFamily: 'Outfit-Black', textTransform: 'uppercase' },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 16, fontFamily: 'Outfit-Bold' },
  eventVedic: { fontSize: 11, fontFamily: 'Outfit-Black', textTransform: 'uppercase', letterSpacing: 0.5 },
  kathaBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 12 
  },
  kathaBtnText: { fontSize: 12, fontFamily: 'Outfit-Bold', color: '#000' },
  notifyBtn: { padding: 10 },
  
  infoCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: { flex: 1, fontSize: 13, fontFamily: 'Outfit-Medium', opacity: 0.8 },
});
