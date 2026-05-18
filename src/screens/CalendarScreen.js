import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import { useSidebar } from '../context/SidebarContext';
import Header from '../components/Header';
import ScreenWrapper from '../components/ScreenWrapper';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Bell, Info, BookOpen, Sun, Moon, Stars } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCalendarEvents } from '../services/youtubeApi';
import { getPanchangForDate } from '../services/astrologyService';

const { width } = Dimensions.get('window');

export default function CalendarScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, language } = useLanguage();
  const { toggleSidebar } = useSidebar();
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [livePanchang, setLivePanchang] = useState(null);
  const [fetchingPanchang, setFetchingPanchang] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchLivePanchang(selectedDate);
  }, [selectedDate, language]);

  const fetchEvents = async () => {
    setLoading(true);
    const data = await getCalendarEvents();
    setEvents(data || []);
    setLoading(false);
  };

  const fetchLivePanchang = async (date) => {
    setFetchingPanchang(true);
    setLivePanchang(null); // Clear old data to prevent stale display
    const data = await getPanchangForDate(date, language);
    if (data) setLivePanchang(data);
    setFetchingPanchang(false);
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const months_hi = [
    "जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून",
    "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"
  ];

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && 
           currentMonth.getMonth() === today.getMonth() && 
           currentMonth.getFullYear() === today.getFullYear();
  };

  const isSelected = (day) => {
    return day === selectedDate.getDate() && 
           currentMonth.getMonth() === selectedDate.getMonth() && 
           currentMonth.getFullYear() === selectedDate.getFullYear();
  };

  const hasEvent = (day) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.some(e => e.event_date === dateStr);
  };

  const getEventForDate = (date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return events.find(e => e.event_date === dateStr);
  };

  const upcomingEvents = events.filter(e => {
    const eventDate = new Date(e.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  }).slice(0, 5);

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
      {item.katha_id || (item.kathas && item.kathas.id) ? (
        <TouchableOpacity 
          style={[styles.kathaBtn, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('Katha', { kathaId: item.katha_id || item.kathas.id, title: item.title })}
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

  const daysInMonth = getDaysInMonth(currentMonth.getMonth(), currentMonth.getFullYear());
  const firstDay = getFirstDayOfMonth(currentMonth.getMonth(), currentMonth.getFullYear());
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const selectedDayEvent = getEventForDate(selectedDate);

  return (
    <ScreenWrapper hasTabBar={true}>
      <View style={[styles.container]}>
        <Header customTitle={t('calendar') || 'Spiritual Calendar'} />
        
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* DAILY PANCHANG & MUHURAT - MOVED TO TOP */}
          <View style={styles.panchangSection}>
            <View style={styles.sectionHeader}>
              <Stars size={18} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {language === 'hi' ? 'आज का पंचांग और मुहूर्त' : 'Daily Panchang & Muhurat'}
              </Text>
              {fetchingPanchang && <ActivityIndicator size="small" color={theme.primary} style={{ marginLeft: 10 }} />}
            </View>
            
            {livePanchang ? (
              <LinearGradient
                colors={[theme.card, theme.primary + '10']}
                style={[styles.panchangCard, { borderColor: theme.border }]}
              >
                <View style={styles.panchangRow}>
                  {livePanchang.tithi && (
                    <View style={styles.panchangItem}>
                      <Text style={[styles.panchangLabel, { color: theme.subtext }]}>{language === 'hi' ? 'तिथी' : 'Tithi'}</Text>
                      <Text style={[styles.panchangValue, { color: theme.text }]}>{livePanchang.tithi}</Text>
                    </View>
                  )}
                  {livePanchang.tithi && livePanchang.paksha && <View style={styles.panchangDivider} />}
                  {livePanchang.paksha && (
                    <View style={styles.panchangItem}>
                      <Text style={[styles.panchangLabel, { color: theme.subtext }]}>{language === 'hi' ? 'पक्ष' : 'Paksha'}</Text>
                      <Text style={[styles.panchangValue, { color: theme.text }]}>{livePanchang.paksha}</Text>
                    </View>
                  )}
                  {livePanchang.paksha && livePanchang.nakshatra && <View style={styles.panchangDivider} />}
                  {livePanchang.nakshatra && (
                    <View style={styles.panchangItem}>
                      <Text style={[styles.panchangLabel, { color: theme.subtext }]}>{language === 'hi' ? 'नक्षत्र' : 'Nakshatra'}</Text>
                      <Text style={[styles.panchangValue, { color: theme.text }]}>{livePanchang.nakshatra}</Text>
                    </View>
                  )}
                </View>

                {(livePanchang.muhurat || livePanchang.rahukaal) && (
                  <View style={[styles.muhuratBox, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
                    {livePanchang.muhurat && (
                      <View style={styles.muhuratItem}>
                        <View style={[styles.muhuratIcon, { backgroundColor: '#10B98120' }]}>
                          <Sun size={14} color="#10B981" />
                        </View>
                        <View>
                          <Text style={[styles.muhuratLabel, { color: '#10B981' }]}>{language === 'hi' ? 'शुभ मुहूर्त' : 'Shubh Muhurat'}</Text>
                          <Text style={[styles.muhuratTime, { color: theme.text }]}>{livePanchang.muhurat}</Text>
                        </View>
                      </View>
                    )}
                    
                    {livePanchang.rahukaal && (
                      <View style={styles.muhuratItem}>
                        <View style={[styles.muhuratIcon, { backgroundColor: '#EF444420' }]}>
                          <Moon size={14} color="#EF4444" />
                        </View>
                        <View>
                          <Text style={[styles.muhuratLabel, { color: '#EF4444' }]}>{language === 'hi' ? 'राहु काल' : 'Rahu Kaal'}</Text>
                          <Text style={[styles.muhuratTime, { color: theme.text }]}>{livePanchang.rahukaal}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* ADDITIONAL PANCHANG DETAILS */}
                {(livePanchang.sunrise || livePanchang.sunset) && (
                  <View style={{ marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', justifyContent: 'space-between' }}>
                    {livePanchang.sunrise && (
                      <Text style={{ fontSize: 11, color: theme.subtext }}>
                        {language === 'hi' ? 'सूर्योदय' : 'Sunrise'}: <Text style={{ color: theme.text }}>{livePanchang.sunrise}</Text>
                      </Text>
                    )}
                    {livePanchang.sunset && (
                      <Text style={{ fontSize: 11, color: theme.subtext }}>
                        {language === 'hi' ? 'सूर्यास्त' : 'Sunset'}: <Text style={{ color: theme.text }}>{livePanchang.sunset}</Text>
                      </Text>
                    )}
                  </View>
                )}
              </LinearGradient>
            ) : !fetchingPanchang && (
              <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 0 }]}>
                <Info size={18} color={theme.subtext} />
                <Text style={[styles.infoText, { color: theme.subtext }]}>
                  {language === 'hi' ? 'इस तारीख के लिए लाइव पंचांग उपलब्ध नहीं है' : 'Live Panchang not available for this date'}
                </Text>
              </View>
            )}
          </View>

          {/* MONTH HEADER */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity style={styles.navBtn} onPress={handlePrevMonth}>
              <ChevronLeft color={theme.text} size={24} />
            </TouchableOpacity>
            <View style={styles.monthTitleBox}>
              <Text style={[styles.monthText, { color: theme.text }]}>
                {language === 'hi' ? months_hi[currentMonth.getMonth()] : months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              <Text style={[styles.hindiMonth, { color: theme.primary }]}>Vaishakha - Jyeshtha</Text>
            </View>
            <TouchableOpacity style={styles.navBtn} onPress={handleNextMonth}>
              <ChevronRight color={theme.text} size={24} />
            </TouchableOpacity>
          </View>

          {/* CALENDAR GRID */}
          <View style={[styles.calendarGrid, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.weekRow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <Text key={i} style={[styles.weekDay, { color: theme.subtext }]}>{day}</Text>
              ))}
            </View>
            <View style={styles.daysGrid}>
              {blanks.map(i => <View key={`blank-${i}`} style={styles.dayCell} />)}
              {days.map(day => (
                <TouchableOpacity 
                  key={day} 
                  onPress={() => setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
                  style={[
                    styles.dayCell, 
                    isSelected(day) && { backgroundColor: theme.primary, borderRadius: 12 },
                    !isSelected(day) && isToday(day) && { borderBottomWidth: 2, borderBottomColor: theme.primary }
                  ]}
                >
                  <Text style={[
                    styles.dayText, 
                    { color: theme.text }, 
                    isSelected(day) && { color: '#000', fontFamily: 'Outfit-Bold' },
                    !isSelected(day) && hasEvent(day) && { color: theme.primary, fontFamily: 'Outfit-Bold' }
                  ]}>
                    {day}
                  </Text>
                  {hasEvent(day) && (
                    <View style={[
                      styles.dot, 
                      { backgroundColor: isSelected(day) ? '#000' : theme.primary }
                    ]} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* SELECTED DATE EVENT */}
          {selectedDayEvent && (
            <View style={styles.eventsSection}>
              <View style={styles.sectionHeader}>
                <Info size={18} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {language === 'hi' ? 'आज का त्योहार' : `Festival on ${selectedDate.toDateString()}`}
                </Text>
              </View>
              {renderFestivalItem({ item: selectedDayEvent })}
            </View>
          )}

          {/* UPCOMING EVENTS */}
          <View style={styles.eventsSection}>
            <View style={styles.sectionHeader}>
              <CalendarIcon size={20} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('upcomingFestivals') || 'Upcoming Festivals'}</Text>
            </View>
            
            <FlatList
              data={upcomingEvents}
              renderItem={renderFestivalItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text style={{ color: theme.subtext, textAlign: 'center', marginTop: 20 }}>No upcoming festivals this month.</Text>
              }
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
    </ScreenWrapper>
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
  
  panchangSection: { paddingHorizontal: 20, marginTop: 10 },
  panchangCard: {
    padding: 20,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
  },
  panchangRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  panchangItem: {
    flex: 1,
    alignItems: 'center',
  },
  panchangLabel: {
    fontSize: 11,
    fontFamily: 'Outfit-Black',
    textTransform: 'uppercase',
    marginBottom: 4,
    opacity: 0.6,
  },
  panchangValue: {
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
  },
  panchangDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  muhuratBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 15,
    borderRadius: 20,
  },
  muhuratItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  muhuratIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  muhuratLabel: {
    fontSize: 10,
    fontFamily: 'Outfit-Black',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  muhuratTime: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    marginTop: 2,
  },
});
