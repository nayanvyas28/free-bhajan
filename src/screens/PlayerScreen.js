import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Share2, ArrowLeft } from 'lucide-react-native';

import { useAuth } from '../context/AuthContext';
import { CONFIG } from '../constants/Config';

export default function PlayerScreen({ route, navigation }) {
  const { videoId, video } = route.params;
  const { snippet } = video;
  const { profile } = useAuth();

  const onShare = async () => {
    try {
      const refCode = profile?.referral_code || 'NONE';
      const playStoreUrlWithReferrer = `${CONFIG.PLAY_STORE_URL}&referrer=ref_${refCode}_id_${videoId}`;
      await Share.share({
        message: `🙏 Jai Shree Ram! 🙏\n\nListen to "${snippet.title}" on *${CONFIG.APP_NAME}* app.\n\n📲 Download / Open here:\n${playStoreUrlWithReferrer}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Now Playing</Text>
        <TouchableOpacity onPress={onShare} style={styles.shareBtn}>
          <Share2 size={24} color="#FF6F00" />
        </TouchableOpacity>
      </View>

      <View style={styles.playerWrapper}>
        <YoutubePlayer 
          height={230} 
          play={true} 
          videoId={videoId} 
        />
      </View>

      <ScrollView style={styles.detailsContainer}>
        <Text style={styles.title}>{snippet.title}</Text>
        <Text style={styles.channel}>{snippet.channelTitle}</Text>
        
        <View style={styles.divider} />
        
        <Text style={styles.descriptionHeader}>Description</Text>
        <Text style={styles.description}>{snippet.description}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  backBtn: {
    padding: 8,
  },
  shareBtn: {
    padding: 8,
  },
  playerWrapper: {
    width: '100%',
    elevation: 10,
    backgroundColor: '#000',
  },
  detailsContainer: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
    lineHeight: 28,
  },
  channel: {
    fontSize: 16,
    color: '#FF6F00',
    fontWeight: '600',
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 20,
  },
  descriptionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
