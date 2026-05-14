import React from 'react';
import { 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  View, 
  Linking, 
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function AdBanner({ banner }) {
  const { theme } = useTheme();

  if (!banner || !banner.is_visible || !banner.image_url) {
    return null;
  }

  const handlePress = () => {
    if (banner.link_url) {
      Linking.openURL(banner.link_url).catch(err => console.error("Couldn't load page", err));
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={handlePress}
      style={[
        styles.container, 
        { 
          backgroundColor: theme.card,
          borderColor: theme.border
        }
      ]}
    >
      <Image 
        source={{ uri: banner.image_url }} 
        style={styles.bannerImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width - 30,
    height: 75,
    marginHorizontal: 15,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.2)',
    marginVertical: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  }
});
