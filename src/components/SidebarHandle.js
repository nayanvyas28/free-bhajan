import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, View, StyleSheet, Dimensions, Animated } from 'react-native';
import { useSidebar } from '../context/SidebarContext';
import { useTheme } from '../context/ThemeContext';

const { height } = Dimensions.get('window');

import { ChevronRight } from 'lucide-react-native';

const SidebarHandle = () => {
  const { toggleSidebar, isOpen } = useSidebar();
  const { theme } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.8)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.2,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  if (isOpen) return null;

  return (
    <Animated.View style={[
      styles.handleContainer,
      { transform: [{ scale: scaleAnim }] }
    ]}>
      <TouchableOpacity 
        onPress={toggleSidebar}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.9}
        style={styles.touchArea}
      >
        <Animated.View 
          style={[
            styles.handle, 
            { 
              backgroundColor: theme.primary,
              opacity: pulseAnim,
              shadowColor: theme.primary,
              borderColor: 'rgba(255,255,255,0.3)',
              borderWidth: 1,
            }
          ]} 
        >
          <ChevronRight size={14} color="#FFF" style={{ marginLeft: -2 }} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  handleContainer: {
    position: 'absolute',
    left: 0,
    top: (height * 0.35) + 15,
    zIndex: 9999,
    elevation: 100,
  },
  touchArea: {
    width: 50,
    height: 100,
    justifyContent: 'center',
  },
  handle: {
    width: 14, // Slightly wider for icon
    height: 80,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 25,
  }
});

export default SidebarHandle;
