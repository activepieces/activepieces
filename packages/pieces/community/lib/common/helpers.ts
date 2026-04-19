import { COLLECTION_KEYS } from './constants';

export function extractItems(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (response && typeof response === 'object') {
    const obj = response as Record<string, unknown>;
    for (const key of COLLECTION_KEYS) {
      if (Array.isArray(obj[key])) {
        return obj[key];
      }
    }
  }

  return [];
}

export function flattenCustomFields(record: Record<string, unknown>): Record<string, unknown> {
  const result = { ...record };

  const customFields = record.custom_fields as Record<string, unknown> | undefined;
  if (customFields && typeof customFields === 'object') {
    for (const [key, value] of Object.entries(customFields)) {
      if (!(key in result)) {
        result[key] = value;
      }
      result[`cf_${key}`] = value;
    }
  }

  return result;
}

export function coerceValue(type: string, value: string): unknown {
  switch (type) {
    case 'number':
      return Number(value);
    case 'boolean':
      return value === 'true' || value === '1';
    case 'json':
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    case 'null':
      return null;
    case 'string':
    default:
      return value;
  }
}

export function buildPairObject(entries: Array<{ field: string; type: string; value: string }>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const entry of entries) {
    result[entry.field] = coerceValue(entry.type, entry.value);
  }
  return result;
}

export function collectFieldMetadata(sample: Record<string, unknown>): Array<{ name: string; type: string; sampleValue: unknown }> {
  const fields: Array<{ name: string; type: string; sampleValue: unknown }> = [];

  for (const [key, value] of Object.entries(sample)) {
    if (key === 'custom_fields') {
      continue;
    }

    let type = 'string';
    if (value === null) {
      type = 'null';
    } else if (Array.isArray(value)) {
      type = 'array';
    } else if (typeof value === 'object') {
      type = 'object';
    } else if (typeof value === 'number') {
      type = 'number';
    } else if (typeof value === 'boolean') {
      type = 'boolean';
    }

    fields.push({ name: key, type, sampleValue: value });
  }

  return fields;
}

export function normalizePath(path: string): string {
  if (!path) {
    return '';
  }
  return path.startsWith('/') ? path : `/${path}`;
}
