import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RiskLevel } from '../../types';
import { Colors, Typography, BorderRadius, Spacing } from '../../theme';

interface Props {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
}

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  low: { label: 'Low Risk', color: Colors.riskLow, bg: 'rgba(48,209,88,0.15)' },
  moderate: { label: 'Moderate', color: Colors.riskModerate, bg: 'rgba(255,159,10,0.15)' },
  high: { label: 'High Risk', color: Colors.riskHigh, bg: 'rgba(255,69,58,0.15)' },
  critical: { label: 'Critical', color: Colors.riskCritical, bg: 'rgba(255,45,85,0.2)' },
};

export default function RiskBadge({ level, size = 'sm' }: Props) {
  const config = RISK_CONFIG[level];
  const fontSize = size === 'lg' ? Typography.sm : Typography.xs;
  const px = size === 'lg' ? Spacing.md : Spacing.sm;
  const py = size === 'lg' ? 6 : 3;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.color + '40',
          paddingHorizontal: px,
          paddingVertical: py,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.label, { color: config.color, fontSize }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
