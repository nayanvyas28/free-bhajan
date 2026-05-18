import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Image, Dimensions, Animated } from 'react-native';
import { Gift, Share2, Users, Clock, Flame, ChevronLeft } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { CONFIG } from '../constants/Config';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function ReferralScreen({ navigation }) {
  const { theme, isDarkMode } = useTheme();
  const { profile, getListeningLimit, referralSettings } = useAuth();

  const listeningLimit = getListeningLimit();
  const threshold = referralSettings?.unlimited_threshold || 10;
  const progress = Math.min((profile?.referral_count || 0) / threshold, 1);

  const onShare = async () => {
    try {
      let shareMsg = referralSettings?.referral_share_message || `🙏 Jai Shree Ram! 🙏\n\nI am listening to beautiful bhajans on *${CONFIG.APP_NAME}*.\n\nUse my Referral Code: {CODE}\n\n📲 Download here: ${CONFIG.PLAY_STORE_URL}`;
      
      // Replace placeholder with actual code
      shareMsg = shareMsg.replace('{CODE}', profile?.referral_code || '');
      
      await Share.share({ message: shareMsg });
    } catch (error) {}
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.primary + '20', 'transparent']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.card }]}>
          <ChevronLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Refer & Earn</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Referral Card */}
        <LinearGradient
          colors={[theme.primary, '#FFD700']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.mainCard}
        >
          <View style={styles.cardInfo}>
            <View>
              <Text style={styles.cardSub}>Your Referral Code</Text>
              <Text style={styles.cardCode}>{profile?.referral_code}</Text>
            </View>
            <TouchableOpacity onPress={onShare} style={styles.cardShareBtn}>
              <Share2 size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Users size={20} color="#FFF" />
              <Text style={styles.statVal}>{profile?.referral_count || 0}</Text>
              <Text style={styles.statLbl}>Referrals</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Clock size={20} color="#FFF" />
              <Text style={styles.statVal}>{listeningLimit === Infinity ? '∞' : listeningLimit}</Text>
              <Text style={styles.statLbl}>Mins/Day</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Progress Section */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Flame size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Unlimited Access Goal</Text>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={[styles.progressBg, { backgroundColor: theme.border }]}>
              <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: theme.primary }]} />
            </View>
            <Text style={[styles.progressText, { color: theme.subtext }]}>
              {profile?.referral_count || 0} of {threshold} referrals done
            </Text>
          </View>
          
          <Text style={[styles.infoText, { color: theme.subtext }]}>
            Invite {threshold} friends to join MantraPuja and unlock **Lifetime Unlimited** listening time for free!
          </Text>
        </View>

        {/* How it works */}
        <View style={styles.howItWorks}>
          <Text style={[styles.howTitle, { color: theme.text }]}>How it works?</Text>
          
          <View style={styles.step}>
            <View style={[styles.stepNum, { backgroundColor: theme.primary }]}>
              <Text style={styles.stepNumText}>1</Text>
            </View>
            <View>
              <Text style={[styles.stepTitle, { color: theme.text }]}>Share your code</Text>
              <Text style={[styles.stepDesc, { color: theme.subtext }]}>Send your unique code to your friends and family.</Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={[styles.stepNum, { backgroundColor: theme.primary }]}>
              <Text style={styles.stepNumText}>2</Text>
            </View>
            <View>
              <Text style={[styles.stepTitle, { color: theme.text }]}>Friends Signup</Text>
              <Text style={[styles.stepDesc, { color: theme.subtext }]}>They enter your code during their first login.</Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={[styles.stepNum, { backgroundColor: theme.primary }]}>
              <Text style={styles.stepNumText}>3</Text>
            </View>
            <View>
              <Text style={[styles.stepTitle, { color: theme.text }]}>Enjoy Bonuses</Text>
              <Text style={[styles.stepDesc, { color: theme.subtext }]}>You get extra listening time for every successful referral!</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.bigShareBtn, { backgroundColor: theme.primary }]}
          onPress={onShare}
        >
          <Share2 size={24} color="#FFF" />
          <Text style={styles.bigShareBtnText}>INVITE FRIENDS NOW</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  mainCard: {
    borderRadius: 30,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  cardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  cardSub: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Outfit-Bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardCode: {
    color: '#FFF',
    fontFamily: 'Outfit-Black',
    fontSize: 32,
    marginTop: 4,
  },
  cardShareBtn: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 20,
    padding: 15,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    marginTop: 4,
  },
  statLbl: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontFamily: 'Outfit-Black',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  section: {
    marginTop: 30,
    borderRadius: 24,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressBg: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    textAlign: 'right',
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    lineHeight: 18,
    opacity: 0.8,
  },
  howItWorks: {
    marginTop: 40,
  },
  howTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    marginBottom: 20,
  },
  step: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 25,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Outfit-Black',
  },
  stepTitle: {
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    opacity: 0.7,
  },
  bigShareBtn: {
    marginTop: 20,
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: 5,
  },
  bigShareBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Outfit-Black',
  },
});
