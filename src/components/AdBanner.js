import React, { useState, useEffect, useRef } from 'react';
import { 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  View, 
  Linking, 
  Dimensions,
  FlatList,
  Animated
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - 30;

export default function AdBanner({ banners, height = 75, noContainer = false }) {
  const { theme, isDarkMode } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Filter visible banners
  const activeBanners = (banners || []).filter(b => b.is_visible);

  useEffect(() => {
    if (activeBanners.length <= 1) return;

    const timer = setInterval(() => {
      let nextIndex = activeIndex + 1;
      if (nextIndex >= activeBanners.length) {
        nextIndex = 0;
      }
      
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 4000);

    return () => clearInterval(timer);
  }, [activeIndex, activeBanners.length]);

  if (activeBanners.length === 0) return null;

  const handlePress = (banner) => {
    if (banner.link_url) {
      Linking.openURL(banner.link_url).catch(err => console.error("Couldn't load page", err));
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={() => handlePress(item)}
      style={[
        styles.bannerContainer, 
        { 
          height: height,
          width: noContainer ? width : BANNER_WIDTH,
          marginHorizontal: noContainer ? 0 : 15,
          borderRadius: noContainer ? 0 : 20,
          borderWidth: noContainer ? 0 : 1,
          backgroundColor: noContainer ? 'transparent' : theme.card,
          borderColor: theme.border,
          elevation: noContainer ? 0 : 8,
          shadowOpacity: noContainer ? 0 : 0.2,
        }
      ]}
    >
      <Image 
        source={{ uri: item.image_url }} 
        style={styles.bannerImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { height: height + 5 }]}>
      <FlatList
        ref={flatListRef}
        data={activeBanners}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => index.toString()}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / (noContainer ? width : BANNER_WIDTH));
          setActiveIndex(index);
        }}
        snapToInterval={noContainer ? width : BANNER_WIDTH + 15}
        decelerationRate="fast"
      />
      
      {activeBanners.length > 1 && (
        <View style={[styles.paginationOverlay, noContainer && { right: 15, bottom: 8 }]}>
          {activeBanners.map((_, index) => {
            const dotWidth = scrollX.interpolate({
              inputRange: [
                (index - 1) * (noContainer ? width : BANNER_WIDTH),
                index * (noContainer ? width : BANNER_WIDTH),
                (index + 1) * (noContainer ? width : BANNER_WIDTH),
              ],
              outputRange: [6, 16, 6],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View 
                key={index} 
                style={[
                  styles.dot, 
                  { 
                    width: dotWidth, 
                    backgroundColor: theme.primary 
                  }
                ]} 
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    alignItems: 'center',
    position: 'relative',
  },
  bannerContainer: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  paginationOverlay: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 10,
    right: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dot: {
    height: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  }
});
