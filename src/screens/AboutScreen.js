import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ChevronLeft, Info, Globe, MessageCircle, Star, Music } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';

export default function AboutScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('aboutApp')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
        <Text style={[styles.appName, { color: theme.text }]}>MantraPuja Bhajan</Text>
        <Text style={[styles.version, { color: theme.subtext }]}>{t('versionLabel')} 1.0.0</Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.primary }]}>{t('ourVision')}</Text>
          <Text style={[styles.description, { color: theme.text }]}>
            {t('visionDescription')}
          </Text>
        </View>

        <View style={styles.features}>
          <View style={[styles.featureItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Star size={24} color={theme.primary} />
            <Text style={[styles.featureText, { color: theme.text }]}>{t('authenticRituals')}</Text>
          </View>
          <View style={[styles.featureItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Info size={24} color={theme.primary} />
            <Text style={[styles.featureText, { color: theme.text }]}>{t('expertAstrologers')}</Text>
          </View>
          <View style={[styles.featureItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Music size={24} color={theme.primary} />
            <Text style={[styles.featureText, { color: theme.text }]}>{t('spiritualLib')}</Text>
          </View>
        </View>

        <View style={[styles.contactCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.primary }]}>{t('getInTouch')}</Text>
          
          <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('https://mantrapuja.com')}>
            <Globe size={20} color={theme.subtext} />
            <Text style={[styles.linkText, { color: theme.text }]}>www.mantrapuja.com</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('mailto:support@mantrapuja.com')}>
            <MessageCircle size={20} color={theme.subtext} />
            <Text style={[styles.linkText, { color: theme.text }]}>support@mantrapuja.com</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.footer, { color: theme.subtext }]}>
        © 2026 MantraPuja Bhajan. {t('allRightsReserved')}
      </Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 20, fontFamily: 'Outfit-Bold' },
  backBtn: { padding: 4 },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  appName: { fontSize: 28, fontFamily: 'Outfit-Bold' },
  version: { fontSize: 14, fontFamily: 'Outfit-Medium' },
  content: { paddingHorizontal: 20 },
  card: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    fontFamily: 'Outfit-Medium',
    lineHeight: 24,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  featureItem: {
    flex: 1,
    minWidth: '45%',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    textAlign: 'center',
  },
  contactCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  linkText: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
  },
  footer: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
  },
});
