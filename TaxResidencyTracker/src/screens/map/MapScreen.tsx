import React, { useRef, useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  ScrollView, Platform, Animated,
} from 'react-native';
import MapView, { Circle, Marker, Callout, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { useAppStore } from '../../store';
import { getJurisdictionGeo, DEFAULT_MAP_REGION } from '../../data/jurisdictionGeo';
import { JurisdictionStat } from '../../types';

const { width, height } = Dimensions.get('window');

// ─── Custom marker for jurisdiction day count ──────────────────────────────────
function DayCountMarker({
  stat,
  onPress,
}: {
  stat: JurisdictionStat & { geo: NonNullable<ReturnType<typeof getJurisdictionGeo>> };
  onPress: () => void;
}) {
  const { jurisdiction, daysSpent, daysAllowed, percentageUsed, riskLevel } = stat;
  const color = jurisdiction.color;

  const borderColor =
    riskLevel === 'critical' ? Colors.riskCritical :
    riskLevel === 'high' ? Colors.riskHigh :
    riskLevel === 'moderate' ? Colors.riskModerate : color;

  return (
    <Marker
      coordinate={{ latitude: stat.geo.latitude, longitude: stat.geo.longitude }}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View style={[styles.markerContainer, { borderColor }]}>
          <View style={[styles.markerInner, { backgroundColor: color + 'EE' }]}>
            <Text style={styles.markerDays}>{daysSpent}</Text>
            <Text style={styles.markerLabel}>days</Text>
          </View>
        </View>
        {/* Pulsing ring for high-risk */}
        {riskLevel === 'critical' && (
          <View style={[styles.markerRing, { borderColor: Colors.riskCritical }]} />
        )}
      </TouchableOpacity>

      <Callout tooltip onPress={onPress}>
        <View style={styles.callout}>
          <View style={styles.calloutHeader}>
            <View style={[styles.calloutDot, { backgroundColor: color }]} />
            <Text style={styles.calloutName}>{jurisdiction.name}</Text>
          </View>
          <Text style={styles.calloutStats}>
            {daysSpent} / {daysAllowed} days  •  {Math.round(percentageUsed)}% used
          </Text>
          <Text style={styles.calloutRemaining}>
            {daysAllowed - daysSpent > 0
              ? `${daysAllowed - daysSpent} days remaining`
              : '⚠️ Limit exceeded'}
          </Text>
          <View style={styles.calloutTap}>
            <Ionicons name="calendar-outline" size={12} color={Colors.primary} />
            <Text style={styles.calloutTapText}>Tap to view calendar</Text>
          </View>
        </View>
      </Callout>
    </Marker>
  );
}

// ─── Legend pill ───────────────────────────────────────────────────────────────
function LegendPill({ stat }: { stat: JurisdictionStat }) {
  const navigation = useNavigation<any>();
  const pct = Math.round(stat.percentageUsed);
  const ringColor =
    stat.riskLevel === 'critical' ? Colors.riskCritical :
    stat.riskLevel === 'high' ? Colors.riskHigh :
    stat.riskLevel === 'moderate' ? Colors.riskModerate : stat.jurisdiction.color;

  return (
    <TouchableOpacity
      style={styles.legendPill}
      onPress={() =>
        navigation.navigate('Dashboard', {
          screen: 'JurisdictionDetail',
          params: { jurisdictionId: stat.jurisdiction.id },
        })
      }
      activeOpacity={0.8}
    >
      <View style={[styles.legendDot, { backgroundColor: stat.jurisdiction.color }]} />
      <View style={styles.legendText}>
        <Text style={styles.legendName} numberOfLines={1}>{stat.jurisdiction.name}</Text>
        <Text style={[styles.legendDays, { color: ringColor }]}>
          {stat.daysSpent}/{stat.daysAllowed}d  •  {pct}%
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Map Screen ───────────────────────────────────────────────────────────
export default function MapScreen() {
  const navigation = useNavigation<any>();
  const { yearSummary, selectedYear } = useAppStore();
  const mapRef = useRef<MapView>(null);
  const [mapRegion, setMapRegion] = useState<Region>(DEFAULT_MAP_REGION);
  const [showLegend, setShowLegend] = useState(true);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');

  // Attach geo data to each stat
  const statsWithGeo = useMemo(() => {
    if (!yearSummary) return [];
    return yearSummary.jurisdictionStats
      .map((stat) => {
        const geo = getJurisdictionGeo(stat.jurisdiction.name);
        return geo ? { ...stat, geo } : null;
      })
      .filter(Boolean) as (JurisdictionStat & {
        geo: NonNullable<ReturnType<typeof getJurisdictionGeo>>;
      })[];
  }, [yearSummary]);

  // Auto-fit map to show all tracked jurisdictions
  const fitToJurisdictions = useCallback(() => {
    if (!mapRef.current || statsWithGeo.length === 0) return;
    const coords = statsWithGeo.map((s) => ({
      latitude: s.geo.latitude,
      longitude: s.geo.longitude,
    }));
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 80, right: 40, bottom: 120, left: 40 },
      animated: true,
    });
  }, [statsWithGeo]);

  // Fly to a specific jurisdiction
  const flyToJurisdiction = useCallback(
    (stat: typeof statsWithGeo[0]) => {
      mapRef.current?.animateToRegion(stat.geo.region, 500);
    },
    []
  );

  const handleMarkerPress = useCallback(
    (stat: typeof statsWithGeo[0]) => {
      navigation.navigate('Calendar', {
        screen: 'CalendarHome',
      });
    },
    [navigation]
  );

  const cycleMapType = () => {
    setMapType((t) => t === 'standard' ? 'satellite' : t === 'satellite' ? 'hybrid' : 'standard');
  };

  return (
    <View style={styles.container}>
      {/* MAP ------------------------------------------------------------------ */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        mapType={mapType}
        initialRegion={DEFAULT_MAP_REGION}
        onRegionChangeComplete={setMapRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        userInterfaceStyle="dark"
        onMapReady={fitToJurisdictions}
      >
        {statsWithGeo.map((stat) => (
          <React.Fragment key={stat.jurisdiction.id}>
            {/* Colored fill circle */}
            <Circle
              center={{ latitude: stat.geo.latitude, longitude: stat.geo.longitude }}
              radius={stat.geo.radius}
              fillColor={stat.jurisdiction.color + '28'}
              strokeColor={stat.jurisdiction.color + '90'}
              strokeWidth={2}
            />
            {/* Risk ring (outer) for high/critical */}
            {(stat.riskLevel === 'high' || stat.riskLevel === 'critical') && (
              <Circle
                center={{ latitude: stat.geo.latitude, longitude: stat.geo.longitude }}
                radius={stat.geo.radius * 1.08}
                fillColor="transparent"
                strokeColor={
                  stat.riskLevel === 'critical' ? Colors.riskCritical + '60' : Colors.riskHigh + '50'
                }
                strokeWidth={3}
              />
            )}
            {/* Day count marker */}
            <DayCountMarker
              stat={stat}
              onPress={() => handleMarkerPress(stat)}
            />
          </React.Fragment>
        ))}
      </MapView>

      {/* ── TOP OVERLAY ─────────────────────────────────────────────────────── */}
      <SafeAreaView style={styles.topOverlay} edges={['top']}>
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <View style={styles.topTitle}>
              <Ionicons name="map" size={16} color={Colors.primary} />
              <Text style={styles.topTitleText}>{selectedYear} Map</Text>
            </View>
            {yearSummary && (
              <Text style={styles.topSubtitle}>
                {yearSummary.jurisdictionStats.length} jurisdiction{yearSummary.jurisdictionStats.length !== 1 ? 's' : ''} tracked
              </Text>
            )}
          </View>

          <View style={styles.topControls}>
            {/* Map type toggle */}
            <TouchableOpacity style={styles.iconBtn} onPress={cycleMapType}>
              <Ionicons
                name={mapType === 'standard' ? 'map-outline' : mapType === 'satellite' ? 'earth' : 'layers'}
                size={18}
                color={Colors.textPrimary}
              />
            </TouchableOpacity>
            {/* Fit to all */}
            <TouchableOpacity style={styles.iconBtn} onPress={fitToJurisdictions}>
              <Ionicons name="expand" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
            {/* Toggle legend */}
            <TouchableOpacity
              style={[styles.iconBtn, showLegend && styles.iconBtnActive]}
              onPress={() => setShowLegend((v) => !v)}
            >
              <Ionicons name="list" size={18} color={showLegend ? Colors.primary : Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* ── MY LOCATION button ──────────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.myLocationBtn}
        onPress={() => {
          mapRef.current?.animateToRegion(
            { ...DEFAULT_MAP_REGION, latitudeDelta: 8, longitudeDelta: 8 },
            500
          );
        }}
      >
        <Ionicons name="locate" size={20} color={Colors.primary} />
      </TouchableOpacity>

      {/* ── QUICK JUMP pills (jurisdiction list) ────────────────────────────── */}
      <View style={styles.jumpScroll}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jumpScrollContent}>
          {statsWithGeo.map((stat) => (
            <TouchableOpacity
              key={stat.jurisdiction.id}
              style={styles.jumpPill}
              onPress={() => flyToJurisdiction(stat)}
              activeOpacity={0.8}
            >
              <View style={[styles.jumpDot, { backgroundColor: stat.jurisdiction.color }]} />
              <Text style={styles.jumpText}>{stat.jurisdiction.name}</Text>
              <Text style={[
                styles.jumpDays,
                { color: stat.riskLevel === 'critical' ? Colors.riskCritical : stat.riskLevel === 'high' ? Colors.riskHigh : Colors.textSecondary }
              ]}>
                {stat.daysSpent}d
              </Text>
            </TouchableOpacity>
          ))}

          {/* Add jurisdiction shortcut */}
          <TouchableOpacity
            style={[styles.jumpPill, styles.jumpPillAdd]}
            onPress={() => navigation.navigate('Settings', { screen: 'ManageJurisdictions' })}
          >
            <Ionicons name="add" size={14} color={Colors.primary} />
            <Text style={[styles.jumpText, { color: Colors.primary }]}>Add</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── LEGEND PANEL ────────────────────────────────────────────────────── */}
      {showLegend && yearSummary && yearSummary.jurisdictionStats.length > 0 && (
        <View style={styles.legendPanel}>
          <View style={styles.legendHeader}>
            <Text style={styles.legendTitle}>{selectedYear} Day Counts</Text>
            <TouchableOpacity onPress={() => setShowLegend(false)}>
              <Ionicons name="close" size={14} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 220 }}>
            {yearSummary.jurisdictionStats.map((stat) => (
              <LegendPill key={stat.jurisdiction.id} stat={stat} />
            ))}
          </ScrollView>

          {/* Totals row */}
          <View style={styles.legendTotal}>
            <Text style={styles.legendTotalText}>
              Total tracked: {yearSummary.totalDaysTracked} / {yearSummary.totalDaysInYear} days
            </Text>
            <View style={[styles.legendTotalDot, { backgroundColor:
              yearSummary.overallRisk === 'critical' ? Colors.riskCritical :
              yearSummary.overallRisk === 'high' ? Colors.riskHigh :
              yearSummary.overallRisk === 'moderate' ? Colors.riskModerate : Colors.riskLow
            }]} />
          </View>
        </View>
      )}

      {/* ── EMPTY STATE ─────────────────────────────────────────────────────── */}
      {statsWithGeo.length === 0 && (
        <View style={styles.emptyOverlay}>
          <View style={styles.emptyCard}>
            <Ionicons name="map-outline" size={32} color={Colors.primary} />
            <Text style={styles.emptyTitle}>No Jurisdictions Tracked</Text>
            <Text style={styles.emptyDesc}>
              Add states or countries to see them color-coded on the map with live day counts.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('Settings', { screen: 'ManageJurisdictions' })}
            >
              <Text style={styles.emptyBtnText}>Add Jurisdictions</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  // ── Top overlay
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(12,12,14,0.88)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
    ...Shadows.md,
  },
  topLeft: { gap: 2 },
  topTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  topTitleText: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textPrimary },
  topSubtitle: { fontSize: Typography.xs, color: Colors.textTertiary },
  topControls: { flexDirection: 'row', gap: Spacing.sm },
  iconBtn: {
    width: 32, height: 32,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  iconBtnActive: {
    backgroundColor: 'rgba(10,132,255,0.2)',
    borderColor: Colors.primary,
  },

  // ── My location
  myLocationBtn: {
    position: 'absolute',
    right: Spacing.base,
    bottom: 260,
    width: 44,
    height: 44,
    backgroundColor: 'rgba(12,12,14,0.9)',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },

  // ── Jump pills
  jumpScroll: {
    position: 'absolute',
    bottom: 180,
    left: 0,
    right: 0,
  },
  jumpScrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  jumpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(12,12,14,0.88)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  jumpPillAdd: { borderColor: 'rgba(10,132,255,0.4)' },
  jumpDot: { width: 7, height: 7, borderRadius: 3.5 },
  jumpText: { fontSize: Typography.xs, color: Colors.textPrimary, fontWeight: Typography.medium },
  jumpDays: { fontSize: Typography.xs, fontWeight: Typography.semibold },

  // ── Legend panel
  legendPanel: {
    position: 'absolute',
    bottom: Spacing.base,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(12,12,14,0.92)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
    ...Shadows.lg,
    zIndex: 10,
  },
  legendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  legendTitle: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  legendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  legendName: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: Typography.medium, flex: 1 },
  legendDays: { fontSize: Typography.xs, fontWeight: Typography.semibold },
  legendTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
  },
  legendTotalText: { fontSize: Typography.xs, color: Colors.textTertiary },
  legendTotalDot: { width: 8, height: 8, borderRadius: 4 },

  // ── Custom markers
  markerContainer: {
    borderWidth: 2.5,
    borderRadius: 20,
    overflow: 'hidden',
    ...Shadows.md,
  },
  markerInner: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  markerDays: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.white,
    lineHeight: 22,
  },
  markerLabel: {
    fontSize: 9,
    fontWeight: Typography.semibold,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  markerRing: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 26,
    borderWidth: 2,
    opacity: 0.6,
  },

  // ── Callout
  callout: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minWidth: 180,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.lg,
  },
  calloutHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  calloutDot: { width: 8, height: 8, borderRadius: 4 },
  calloutName: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textPrimary },
  calloutStats: { fontSize: Typography.xs, color: Colors.textSecondary, marginBottom: 2 },
  calloutRemaining: { fontSize: Typography.xs, color: Colors.textTertiary, marginBottom: 6 },
  calloutTap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  calloutTapText: { fontSize: Typography.xs, color: Colors.primary },

  // ── Empty state
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(12,12,14,0.6)',
  },
  emptyCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.xl,
    padding: Spacing['2xl'],
    alignItems: 'center',
    gap: Spacing.md,
    maxWidth: 300,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.lg,
  },
  emptyTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textPrimary, textAlign: 'center' },
  emptyDesc: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  emptyBtnText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.white },
});
