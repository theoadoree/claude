import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Shadows } from '../../theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  colors?: readonly [string, string, ...string[]];
  padding?: number;
}

export default function GradientCard({
  children,
  style,
  colors = [Colors.backgroundSecondary, Colors.backgroundTertiary] as const,
  padding = 16,
}: Props) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { padding }, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
    ...Shadows.md,
  },
});
