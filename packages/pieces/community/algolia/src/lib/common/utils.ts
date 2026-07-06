import { AlgoliaAuthValue, AlgoliaJsonValue, AlgoliaRecord } from './types';

export function parseRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

export function parseStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${fieldName} must contain at least one value.`);
  }

  return value.map((entry, index) => {
    if (typeof entry !== 'string' || entry.trim().length === 0) {
      throw new Error(`${fieldName} item ${index + 1} must be a non-empty string.`);
    }

    return entry.trim();
  });
}

export function parseAlgoliaRecordArray(value: unknown): AlgoliaRecord[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('Records must be a non-empty array of JSON objects.');
  }

  return value.map((entry, index) => {
    if (!isAlgoliaRecord(entry)) {
      throw new Error(
        `Record ${index + 1} must be a JSON object with JSON-compatible values.`,
      );
    }

    return entry;
  });
}

export function isAlgoliaAuthValue(value: unknown): value is AlgoliaAuthValue {
  if (!isObject(value)) {
    return false;
  }

  const props = value['props'];
  if (!isObject(props)) {
    return false;
  }

  return (
    typeof props['applicationId'] === 'string' &&
    props['applicationId'].trim().length > 0 &&
    typeof props['apiKey'] === 'string' &&
    props['apiKey'].trim().length > 0
  );
}

function isAlgoliaRecord(value: unknown): value is AlgoliaRecord {
  if (!isObject(value)) {
    return false;
  }

  return Object.values(value).every(isAlgoliaJsonValue);
}

function isAlgoliaJsonValue(value: unknown): value is AlgoliaJsonValue {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isAlgoliaJsonValue);
  }

  return isObject(value) && Object.values(value).every(isAlgoliaJsonValue);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
