import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { format, parseISO } from 'date-fns';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useAppStore } from '../../store';
import { Document, DocumentType } from '../../types';

const DOCUMENT_TYPES: { type: DocumentType; label: string; icon: string; color: string }[] = [
  { type: 'flight', label: 'Flights', icon: 'airplane', color: Colors.primary },
  { type: 'hotel', label: 'Hotels', icon: 'bed', color: Colors.accent },
  { type: 'receipt', label: 'Receipts', icon: 'receipt', color: Colors.secondary },
  { type: 'photo', label: 'Photos', icon: 'camera', color: '#BF5AF2' },
  { type: 'screenshot', label: 'Screenshots', icon: 'phone-portrait', color: '#FF2D55' },
  { type: 'other', label: 'Other', icon: 'document', color: Colors.textSecondary },
];

function DocumentCard({ doc, onPress, onDelete }: { doc: Document; onPress: () => void; onDelete: () => void }) {
  const typeConfig = DOCUMENT_TYPES.find((t) => t.type === doc.type) || DOCUMENT_TYPES[5];

  return (
    <TouchableOpacity style={styles.docCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.docIcon, { backgroundColor: typeConfig.color + '20' }]}>
        <Ionicons name={typeConfig.icon as any} size={22} color={typeConfig.color} />
      </View>
      <View style={styles.docInfo}>
        <Text style={styles.docTitle} numberOfLines={1}>{doc.title}</Text>
        <Text style={styles.docDate}>{format(parseISO(doc.date), 'MMM d, yyyy')}</Text>
        {doc.extractedData?.origin && (
          <Text style={styles.docMeta}>
            {doc.extractedData.origin} → {doc.extractedData.destination}
          </Text>
        )}
        {doc.extractedData?.checkIn && (
          <Text style={styles.docMeta}>
            Check-in: {format(parseISO(doc.extractedData.checkIn), 'MMM d')}
            {doc.extractedData.checkOut && ` → ${format(parseISO(doc.extractedData.checkOut), 'MMM d')}`}
          </Text>
        )}
        {doc.description && (
          <Text style={styles.docDesc} numberOfLines={1}>{doc.description}</Text>
        )}
      </View>
      <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="trash-outline" size={16} color={Colors.textTertiary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function DocumentsScreen() {
  const navigation = useNavigation<any>();
  const { documents, addDocument, removeDocument } = useAppStore();
  const [activeFilter, setActiveFilter] = useState<DocumentType | 'all'>('all');
  const [isAddMenuVisible, setIsAddMenuVisible] = useState(false);

  const filtered = activeFilter === 'all'
    ? documents
    : documents.filter((d) => d.type === activeFilter);

  const sortedDocs = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  const handleAddPhoto = async () => {
    setIsAddMenuVisible(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await addDocument({
        type: 'photo',
        title: 'Photo ' + format(new Date(), 'MMM d, yyyy'),
        uri: asset.uri,
        date: new Date().toISOString().split('T')[0],
        tags: [],
        mimeType: 'image/jpeg',
        fileSize: asset.fileSize,
      });
    }
  };

  const handleTakePhoto = async () => {
    setIsAddMenuVisible(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera access is needed to take photos');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await addDocument({
        type: 'photo',
        title: 'Photo ' + format(new Date(), 'MMM d, yyyy HH:mm'),
        uri: asset.uri,
        date: new Date().toISOString().split('T')[0],
        tags: [],
        mimeType: 'image/jpeg',
        fileSize: asset.fileSize,
      });
    }
  };

  const handleDelete = (doc: Document) => {
    Alert.alert('Delete Document', `Remove "${doc.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeDocument(doc.id) },
    ]);
  };

  const docCounts: Record<string, number> = {};
  documents.forEach((d) => {
    docCounts[d.type] = (docCounts[d.type] || 0) + 1;
  });

  return (
    <LinearGradient colors={['#0C0C0E', '#0D1520', '#0C0C0E']} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Evidence Vault</Text>
            <Text style={styles.headerSubtitle}>{documents.length} documents stored</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setIsAddMenuVisible(!isAddMenuVisible)}
          >
            <LinearGradient colors={Colors.gradientPrimary} style={styles.addBtnGradient}>
              <Ionicons name={isAddMenuVisible ? 'close' : 'add'} size={20} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Add Menu */}
        {isAddMenuVisible && (
          <View style={styles.addMenu}>
            {[
              { icon: 'airplane', label: 'Add Flight', onPress: () => { setIsAddMenuVisible(false); navigation.navigate('AddDocument', { type: 'flight' }); } },
              { icon: 'bed', label: 'Add Hotel', onPress: () => { setIsAddMenuVisible(false); navigation.navigate('AddDocument', { type: 'hotel' }); } },
              { icon: 'image', label: 'Photo from Library', onPress: handleAddPhoto },
              { icon: 'camera', label: 'Take Photo', onPress: handleTakePhoto },
              { icon: 'document-text', label: 'Other Document', onPress: () => { setIsAddMenuVisible(false); navigation.navigate('AddDocument', { type: 'other' }); } },
            ].map((item, i) => (
              <TouchableOpacity key={i} style={styles.addMenuItem} onPress={item.onPress}>
                <Ionicons name={item.icon as any} size={18} color={Colors.primary} />
                <Text style={styles.addMenuLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'all' && styles.filterChipTextActive]}>
              All ({documents.length})
            </Text>
          </TouchableOpacity>
          {DOCUMENT_TYPES.map((type) => (
            <TouchableOpacity
              key={type.type}
              style={[
                styles.filterChip,
                activeFilter === type.type && styles.filterChipActive,
                activeFilter === type.type && { borderColor: type.color },
              ]}
              onPress={() => setActiveFilter(type.type)}
            >
              <Ionicons
                name={type.icon as any}
                size={12}
                color={activeFilter === type.type ? type.color : Colors.textTertiary}
              />
              <Text style={[
                styles.filterChipText,
                activeFilter === type.type && { color: type.color },
              ]}>
                {type.label} {docCounts[type.type] ? `(${docCounts[type.type]})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {sortedDocs.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="folder-open-outline" size={40} color={Colors.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>No documents yet</Text>
              <Text style={styles.emptyDesc}>
                Upload boarding passes, hotel receipts, photos, and screenshots to build your audit defense.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => setIsAddMenuVisible(true)}
              >
                <Ionicons name="add" size={16} color={Colors.primary} />
                <Text style={styles.emptyBtnText}>Add First Document</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.docList}>
              {sortedDocs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onPress={() => navigation.navigate('DocumentDetail', { documentId: doc.id })}
                  onDelete={() => handleDelete(doc)}
                />
              ))}
            </View>
          )}

          {/* Info banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Build a strong audit defense</Text>
              <Text style={styles.infoDesc}>
                Keep boarding passes, hotel folios, credit card statements, and any evidence showing where you were on each day.
              </Text>
            </View>
          </View>

          <View style={{ height: Spacing['3xl'] }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
  },
  headerTitle: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.textPrimary, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: Typography.sm, color: Colors.textTertiary },
  addBtn: { borderRadius: BorderRadius.full, overflow: 'hidden' },
  addBtnGradient: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  addMenu: {
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  addMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  addMenuLabel: { fontSize: Typography.sm, color: Colors.textPrimary },

  filterScroll: { maxHeight: 50 },
  filterContent: { paddingHorizontal: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing.sm },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: 'rgba(10,132,255,0.1)', borderColor: Colors.primary },
  filterChipText: { fontSize: Typography.xs, color: Colors.textTertiary },
  filterChipTextActive: { color: Colors.primary, fontWeight: Typography.semibold },

  scroll: { paddingHorizontal: Spacing.base, gap: Spacing.md },
  docList: { gap: Spacing.sm },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  docIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfo: { flex: 1 },
  docTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  docDate: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
  docMeta: { fontSize: Typography.xs, color: Colors.primary, marginTop: 2 },
  docDesc: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },

  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    gap: Spacing.md,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  emptyDesc: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(10,132,255,0.15)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(10,132,255,0.3)',
  },
  emptyBtnText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.primary },

  infoBanner: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: 'rgba(10,132,255,0.08)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(10,132,255,0.2)',
    marginTop: Spacing.md,
  },
  infoText: { flex: 1 },
  infoTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.primary },
  infoDesc: { fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 16, marginTop: 3 },
});
