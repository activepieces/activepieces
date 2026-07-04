import { GlideRow, GlideRowValue } from './types';

export function parseRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

export function parseGlideRow(value: unknown): GlideRow {
  if (!isGlideRow(value)) {
    throw new Error('Row must be a JSON object.');
  }

  return value;
}

export function parseGlideRows(value: unknown): GlideRow[] {
  if (!Array.isArray(value) || !value.every((row) => isGlideRow(row))) {
    throw new Error('Rows must be an array of JSON objects.');
  }

  return value;
}

export function flattenGlideRows(rows: GlideRow[]): FlatRecord[] {
  return normalizeRecords(rows.map(flattenRecord));
}


function flattenRecord(value: GlideRow): FlatRecord {
  const flattened: FlatRecord = {};
  flattenIntoRecord(value, '', flattened);
  return flattened;
}

function normalizeRecords(records: FlatRecord[]): FlatRecord[] {
  const keys = new Set<string>();

  for (const record of records) {
    for (const key of Object.keys(record)) {
      keys.add(key);
    }
  }

  const normalizedKeys = Array.from(keys);

  return records.map((record) => {
    const normalized: FlatRecord = {};

    for (const key of normalizedKeys) {
      normalized[key] = record[key] ?? null;
    }

    return normalized;
  });
}

function flattenIntoRecord(
  value: GlideRowValue | undefined,
  prefix: string,
  flattened: FlatRecord,
): void {
  if (value === undefined) {
    if (prefix) {
      flattened[prefix] = null;
    }
    return;
  }

  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    if (prefix) {
      flattened[prefix] = value;
    }
    return;
  }

  if (Array.isArray(value)) {
    if (prefix) {
      flattened[prefix] = formatArrayValue(value);
    }
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const nextPrefix = prefix ? `${prefix}_${key}` : key;
    flattenIntoRecord(nestedValue, nextPrefix, flattened);
  }
}

function formatArrayValue(values: GlideRowValue[]): PrimitiveValue {
  if (values.length === 0) {
    return null;
  }

  return values
    .map((value) => {
      if (value === null) {
        return 'null';
      }

      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        return String(value);
      }

      if (Array.isArray(value)) {
        return formatArrayValue(value) ?? '';
      }

      return JSON.stringify(flattenRecord(value));
    })
    .join(', ');
}

function isGlideRow(value: unknown): value is GlideRow {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every((item) => isGlideRowValue(item));
}

function isGlideRowValue(value: unknown): value is GlideRowValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every((item) => isGlideRowValue(item));
  }

  return isGlideRow(value);
}

type PrimitiveValue = string | number | boolean | null;

export type FlatRecord = Record<string, PrimitiveValue>;
