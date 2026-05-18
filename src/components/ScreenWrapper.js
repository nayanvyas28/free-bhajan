import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBanners } from '../context/BannerContext';
import AdBanner from './AdBanner';
import { useTheme } from '../context/ThemeContext';

const ScreenWrapper = ({ 
  children, 
  hasTabBar = false, 
  style, 
  showTopBanner = true
}) => {
  const insets = useSafeAreaInsets();
  const { getBannersByPosition } = useBanners();
  const { theme } = useTheme();

  const topBanners = getBannersByPosition('top');
  const bottomBanners = getBannersByPosition('bottom');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }, style]}>
      {/* Top Banner Carousel - Controlled from Admin */}
      {showTopBanner && topBanners.length > 0 && (
        <View style={{ paddingTop: insets.top }}>
          <AdBanner banners={topBanners} height={65} noContainer={false} />
        </View>
      )}

      {/* Main Screen Content */}
      <View style={{ flex: 1, paddingTop: !showTopBanner ? insets.top : 0 }}>
        {children}
      </View>

      {/* Bottom Banner Carousel - Just above Tab Bar */}
      <View style={{ 
        paddingBottom: hasTabBar ? 58 : insets.bottom + 5,
        backgroundColor: 'transparent'
      }}>
        <AdBanner banners={bottomBanners} height={60} noContainer={true} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ScreenWrapper;
