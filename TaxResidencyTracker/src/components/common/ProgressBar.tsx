import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { Colors, BorderRadius } from '../../theme';

interface Props {
  progress: number; // 0-100
  color?: string;
  backgroundColor?: string;
  height?: number;
  style?: ViewStyle;
  animated?: boolean;
}

export default function ProgressBar({
  progress,
  color,
  backgroundColor = Colors.backgroundTertiary,
  height = 6,
  style,
  animated = true,
}: Props) {
  const animValue = useRef(new Animated.Value(0)).current;

  const clampedProgress = Math.min(100, Math.max(0, progress));

  const barColor =
    color ||
    (clampedProgress >= 100
      ? Colors.riskCritical
      : clampedProgress >= 85
      ? Colors.riskHigh
      : clampedProgress >= 70
      ? Colors.riskModerate
      : Colors.primary);

  useEffect(() => {
    if (animated) {
      Animated.timing(animValue, {
        toValue: clampedProgress,
        duration: 600,
        useNativeDriver: false,
      }).start();
    } else {
      animValue.setValue(clampedProgress);
    }
  }, [clampedProgress]);

  const width = animValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.track, { backgroundColor, height, borderRadius: height / 2 }, style]}>
      <Animated.View
        style={[
          styles.fill,
          {
            width,
            height,
            backgroundColor: barColor,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
