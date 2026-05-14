import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBanners } from '../context/BannerContext';
import AdBanner from './AdBanner';
import { useTheme } from '../context/ThemeContext';

const ScreenWrapper = ({ children, hasTabBar = false, style }) => {
  const insets = useSafeAreaInsets();
  const { getBanner } = useBanners();
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }, style]}>
      {/* Main Screen Content */}
      <View style={{ flex: 1, paddingTop: insets.top }}>
        {children}
      </View>

      {/* Bottom Banner - Above Tab Bar or at Bottom */}
      <View style={{ 
        paddingBottom: hasTabBar ? 70 : insets.bottom + 10,
        backgroundColor: 'transparent'
      }}>
        <AdBanner banner={getBanner('bottom')} />
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
