/**
 * CloudBackupService.ts
 *
 * Strategy:
 * - iOS:   Writes backup JSON to app's Documents directory.
 *          Apple's iCloud Backup automatically syncs this folder when iCloud
 *          Backup is enabled. Also supports explicit iCloud Drive export via
 *          expo-sharing so the user can save to iCloud Drive manually.
 *
 * - Android: Writes backup to app's Documents directory.
 *             Android Auto Backup (API 23+) handles this automatically.
 *             Also supports explicit Google Drive / Files export via expo-sharing.
 *
 * Both platforms get:
 *   1. Auto-backup on every app launch (last 7 daily snapshots kept)
 *   2. Manual "Export backup" → share sheet (save to iCloud Drive / Google Drive)
 *   3. Manual "Restore backup" → import from file picker
 */
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKUP_DIR = FileSystem.documentDirectory + 'TaxTrackBackups/';
const BACKUP_PREFIX = 'taxtrack-backup-';
const MAX_AUTO_BACKUPS = 7; // Keep one per day for a week

// ─── Storage keys to backup ────────────────────────────────────────────────────
const STORAGE_KEYS = [
  '@taxtracker/user_profile',
  '@taxtracker/jurisdictions',
  '@taxtracker/location_entries',
  '@taxtracker/documents',
  '@taxtracker/flights',
  '@taxtracker/hotels',
];

// ─── Ensure backup directory exists ───────────────────────────────────────────
async function ensureBackupDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(BACKUP_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
  }
}

// ─── Create a backup snapshot ─────────────────────────────────────────────────
export interface BackupSnapshot {
  version: number;
  createdAt: string;
  platform: string;
  data: Record<string, string | null>;
}

async function createSnapshot(): Promise<BackupSnapshot> {
  const values = await Promise.all(
    STORAGE_KEYS.map(async (key) => ({ key, value: await AsyncStorage.getItem(key) }))
  );
  const data: Record<string, string | null> = {};
  values.forEach(({ key, value }) => { data[key] = value; });

  return {
    version: 2,
    createdAt: new Date().toISOString(),
    platform: Platform.OS,
    data,
  };
}

async function applySnapshot(snapshot: BackupSnapshot): Promise<void> {
  for (const [key, value] of Object.entries(snapshot.data)) {
    if (value !== null && value !== undefined) {
      await AsyncStorage.setItem(key, value);
    }
  }
}

// ─── Auto-backup (call on app launch) ─────────────────────────────────────────
export async function performAutoBackup(): Promise<void> {
  try {
    await ensureBackupDir();

    const today = new Date().toISOString().split('T')[0];
    const filename = `${BACKUP_PREFIX}${today}.json`;
    const path = BACKUP_DIR + filename;

    // Don't overwrite today's backup if it already exists from earlier today
    const existing = await FileSystem.getInfoAsync(path);
    if (existing.exists) return;

    const snapshot = await createSnapshot();
    await FileSystem.writeAsStringAsync(path, JSON.stringify(snapshot, null, 2));

    // Prune old backups beyond MAX_AUTO_BACKUPS
    await pruneOldBackups();
  } catch (e) {
    console.warn('[CloudBackupService] Auto-backup error:', e);
  }
}

async function pruneOldBackups(): Promise<void> {
  try {
    const dir = await FileSystem.readDirectoryAsync(BACKUP_DIR);
    const backups = dir
      .filter((f) => f.startsWith(BACKUP_PREFIX) && f.endsWith('.json'))
      .sort()
      .reverse(); // newest first

    if (backups.length > MAX_AUTO_BACKUPS) {
      const toDelete = backups.slice(MAX_AUTO_BACKUPS);
      await Promise.all(toDelete.map((f) => FileSystem.deleteAsync(BACKUP_DIR + f, { idempotent: true })));
    }
  } catch (e) {
    console.warn('[CloudBackupService] Prune error:', e);
  }
}

// ─── List available backups ────────────────────────────────────────────────────
export interface BackupInfo {
  filename: string;
  path: string;
  date: string;
  sizeBytes: number;
}

export async function listBackups(): Promise<BackupInfo[]> {
  try {
    await ensureBackupDir();
    const dir = await FileSystem.readDirectoryAsync(BACKUP_DIR);
    const infos = await Promise.all(
      dir
        .filter((f) => f.startsWith(BACKUP_PREFIX) && f.endsWith('.json'))
        .sort()
        .reverse()
        .map(async (filename) => {
          const path = BACKUP_DIR + filename;
          const info = await FileSystem.getInfoAsync(path);
          return {
            filename,
            path,
            date: filename.replace(BACKUP_PREFIX, '').replace('.json', ''),
            sizeBytes: (info as any).size ?? (info as any).fileSize ?? 0,
          };
        })
    );
    return infos;
  } catch (e) {
    return [];
  }
}

// ─── Manual export: share to iCloud Drive / Google Drive / Files ──────────────
export async function exportBackupToCloud(): Promise<{ success: boolean; message: string }> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return { success: false, message: 'Sharing is not available on this device' };
    }

    await ensureBackupDir();
    const snapshot = await createSnapshot();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `taxtrack-export-${timestamp}.json`;
    const tempPath = FileSystem.cacheDirectory + filename;

    await FileSystem.writeAsStringAsync(tempPath, JSON.stringify(snapshot, null, 2));

    await Sharing.shareAsync(tempPath, {
      mimeType: 'application/json',
      dialogTitle: 'Save TaxTrack Backup',
      UTI: 'public.json',
    });

    return { success: true, message: 'Backup shared — save to iCloud Drive or Google Drive' };
  } catch (e: any) {
    return { success: false, message: e?.message || 'Export failed' };
  }
}

// ─── Manual import / restore ──────────────────────────────────────────────────
export async function importBackupFromFile(): Promise<{ success: boolean; message: string; entriesRestored?: number }> {
  try {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
    });

    if (picked.canceled || !picked.assets?.[0]) {
      return { success: false, message: 'No file selected' };
    }

    const content = await FileSystem.readAsStringAsync(picked.assets[0].uri);
    const snapshot: BackupSnapshot = JSON.parse(content);

    if (!snapshot.version || !snapshot.data) {
      return { success: false, message: 'Invalid backup file format' };
    }

    await applySnapshot(snapshot);

    const entries = snapshot.data['@taxtracker/location_entries'];
    const count = entries ? JSON.parse(entries).length : 0;

    return {
      success: true,
      message: `Restored from backup (${snapshot.createdAt.split('T')[0]})`,
      entriesRestored: count,
    };
  } catch (e: any) {
    return { success: false, message: e?.message || 'Restore failed' };
  }
}

// ─── Restore from a local auto-backup ─────────────────────────────────────────
export async function restoreFromLocalBackup(backupPath: string): Promise<{ success: boolean; message: string }> {
  try {
    const content = await FileSystem.readAsStringAsync(backupPath);
    const snapshot: BackupSnapshot = JSON.parse(content);
    await applySnapshot(snapshot);
    return { success: true, message: `Restored from ${snapshot.createdAt.split('T')[0]}` };
  } catch (e: any) {
    return { success: false, message: e?.message || 'Restore failed' };
  }
}
