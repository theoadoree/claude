import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { LocationEntry, ImportResult, MonaeoCSVRow } from '../types';

// ─── Monaeo CSV Parser ─────────────────────────────────────────────────────────
// Monaeo exports CSVs with columns like: Date, Location, City, State, Country, Type

function parseMonaeoCSV(csvText: string): Omit<LocationEntry, 'id' | 'createdAt' | 'updatedAt'>[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
  const entries: Omit<LocationEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted CSV values
    const values = parseCSVLine(line);
    if (values.length < 2) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || '').replace(/"/g, '').trim();
    });

    const dateStr = row['date'] || row['day'] || row['travel date'] || '';
    if (!dateStr) continue;

    const parsedDate = parseDate(dateStr);
    if (!parsedDate) continue;

    const location = row['location'] || row['jurisdiction'] || '';
    const city = row['city'] || '';
    const state = row['state'] || row['region'] || '';
    const country = row['country'] || '';
    const type = row['type'] || row['activity'] || 'unknown';

    entries.push({
      date: parsedDate,
      jurisdictionName: location || state || city || country,
      city: city || undefined,
      state: state || undefined,
      country: country || undefined,
      activityType: mapActivityType(type),
      isVerified: false,
      source: 'import',
      notes: `Imported from Monaeo: ${location}`,
    });
  }

  return entries;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseDate(dateStr: string): string | null {
  // Handle formats: MM/DD/YYYY, YYYY-MM-DD, MM-DD-YYYY, Month DD YYYY
  dateStr = dateStr.trim();

  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  // MM/DD/YYYY or M/D/YYYY
  const mdy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    return `${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`;
  }

  // MM-DD-YYYY
  const mdyDash = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (mdyDash) {
    return `${mdyDash[3]}-${mdyDash[1].padStart(2, '0')}-${mdyDash[2].padStart(2, '0')}`;
  }

  // Try native Date parsing
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return null;
}

function mapActivityType(type: string): LocationEntry['activityType'] {
  const lower = type.toLowerCase();
  if (lower.includes('work') || lower.includes('business')) return 'work';
  if (lower.includes('personal') || lower.includes('leisure') || lower.includes('vacation')) return 'personal';
  if (lower.includes('transit') || lower.includes('travel') || lower.includes('flight')) return 'transit';
  return 'unknown';
}

// ─── Generic CSV Parser (for other formats) ────────────────────────────────────
function parseGenericCSV(csvText: string): Omit<LocationEntry, 'id' | 'createdAt' | 'updatedAt'>[] {
  // Try Monaeo format first, if it has enough columns with known headers
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  const firstLine = lines[0].toLowerCase();
  if (
    firstLine.includes('date') ||
    firstLine.includes('location') ||
    firstLine.includes('state') ||
    firstLine.includes('country')
  ) {
    return parseMonaeoCSV(csvText);
  }
  return [];
}

// ─── Public API ────────────────────────────────────────────────────────────────
export async function pickAndParseCSV(): Promise<{
  entries: Omit<LocationEntry, 'id' | 'createdAt' | 'updatedAt'>[];
  result: ImportResult;
}> {
  const result: ImportResult = { success: false, imported: 0, skipped: 0, errors: [] };

  try {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/plain', 'application/csv', '*/*'],
      copyToCacheDirectory: true,
    });

    if (picked.canceled || !picked.assets?.[0]) {
      result.errors.push('No file selected');
      return { entries: [], result };
    }

    const fileUri = picked.assets[0].uri;
    const csvText = await FileSystem.readAsStringAsync(fileUri);
    const entries = parseGenericCSV(csvText);

    result.success = true;
    result.imported = entries.length;
    return { entries, result };
  } catch (e: any) {
    result.errors.push(e?.message || 'Unknown error parsing CSV');
    return { entries: [], result };
  }
}

export function parseSampleMonaeoData(): Omit<LocationEntry, 'id' | 'createdAt' | 'updatedAt'>[] {
  // Returns a few sample entries for demo purposes
  const today = new Date();
  const entries = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    entries.push({
      date: dateStr,
      jurisdictionName: i < 20 ? 'New York' : 'Florida',
      city: i < 20 ? 'New York City' : 'Miami',
      state: i < 20 ? 'New York' : 'Florida',
      country: 'United States',
      activityType: (i % 5 === 0 ? 'work' : 'personal') as LocationEntry['activityType'],
      isVerified: false,
      source: 'import' as const,
      notes: 'Sample data',
    });
  }
  return entries;
}
