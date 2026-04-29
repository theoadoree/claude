import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

const { width, height } = Dimensions.get('window');

const FEATURES = [
  {
    icon: 'location',
    title: 'Automatic Tracking',
    description: 'WiFi & cell tower detection logs your location daily — no check-ins required',
  },
  {
    icon: 'shield-checkmark',
    title: 'Tax Compliance',
    description: 'Real-time day counts across all jurisdictions with smart threshold alerts',
  },
  {
    icon: 'trending-up',
    title: 'Tax Planning',
    description: 'Audit risk scoring, jurisdiction recommendations, and optimization strategies',
  },
  {
    icon: 'folder',
    title: 'Evidence Vault',
    description: 'Store boarding passes, hotel receipts, and photos organized by date',
  },
];

export default function WelcomeScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <LinearGradient colors={['#0C0C0E', '#0F1923', '#0C0C0E']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Logo / Icon */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={Colors.gradientPrimary}
              style={styles.logoGradient}
            >
              <Ionicons name="navigate" size={40} color={Colors.white} />
            </LinearGradient>
            <View style={styles.logoPulse} />
          </View>

          {/* Headline */}
          <View style={styles.headline}>
            <Text style={styles.appName}>TaxTrack</Text>
            <Text style={styles.tagline}>Location-based tax residency{'\n'}tracking & planning</Text>
          </View>

          {/* Feature Pills */}
          <View style={styles.features}>
            {FEATURES.map((feature, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon as any} size={18} color={Colors.primary} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* CTA */}
          <View style={styles.cta}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('ResidencySetup')}
              activeOpacity={0.85}
            >
              <LinearGradient colors={Colors.gradientPrimary} style={styles.primaryBtnGradient}>
                <Text style={styles.primaryBtnText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.white} />
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Your location data is stored only on your device.{'\n'}We never share or sell your data.
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: Spacing['2xl'],
    justifyContent: 'center',
    gap: Spacing['2xl'],
  },
  logoContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  logoGradient: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  logoPulse: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 30,
    backgroundColor: 'rgba(10,132,255,0.1)',
    top: -11,
  },
  headline: { alignItems: 'center', gap: Spacing.sm },
  appName: {
    fontSize: Typography['4xl'],
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  features: { gap: Spacing.base },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.glassBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(10,132,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1 },
  featureTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  cta: { gap: Spacing.base, alignItems: 'center' },
  primaryBtn: {
    width: '100%',
    borderRadius: BorderRadius.base,
    overflow: 'hidden',
  },
  primaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: Spacing.sm,
  },
  primaryBtnText: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.white,
  },
  disclaimer: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
