export function flattenRecord(value: unknown): FlatRecord {
  const flattened: FlatRecord = {};
  flattenIntoRecord(value, '', flattened);
  return flattened;
}

export function normalizeRecords(records: FlatRecord[]): FlatRecord[] {
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
  value: unknown,
  prefix: string,
  flattened: FlatRecord,
): void {
  if (value === undefined) {
    if (prefix) {
      flattened[prefix] = null;
    }
    return;
  }

  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    if (prefix) {
      flattened[prefix] = value;
    }
    return;
  }

  if (value instanceof Date) {
    if (prefix) {
      flattened[prefix] = value.toISOString();
    }
    return;
  }

  if (Array.isArray(value)) {
    if (prefix) {
      flattened[prefix] = formatArrayValue(value);
    }
    return;
  }

  if (!isRecord(value)) {
    if (prefix) {
      flattened[prefix] = String(value);
    }
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const nextPrefix = prefix ? `${prefix}_${key}` : key;
    flattenIntoRecord(nestedValue, nextPrefix, flattened);
  }
}

function formatArrayValue(values: unknown[]): PrimitiveValue {
  if (values.length === 0) {
    return null;
  }

  return values.map((value) => {
    if (value === null || value === undefined) {
      return 'null';
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (Array.isArray(value)) {
      return formatArrayValue(value) ?? '';
    }

    if (isRecord(value)) {
      return JSON.stringify(flattenRecord(value));
    }

    return String(value);
  }).join(', ');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

type PrimitiveValue = string | number | boolean | null;

export type FlatRecord = Record<string, PrimitiveValue>;
