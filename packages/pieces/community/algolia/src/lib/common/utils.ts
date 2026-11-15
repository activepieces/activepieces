import { AlgoliaAuthValue, AlgoliaJsonValue, AlgoliaRecord } from './types';

export function isValidApplicationId(value: string): boolean {
  return /^[A-Za-z0-9]+$/.test(value.trim());
}

export function parseApplicationId(value: string): string {
  const applicationId = value.trim();
  if (!isValidApplicationId(applicationId)) {
    throw new Error(
      'Invalid Algolia Application ID: it must contain only letters and digits (find it under Settings > API Keys).',
    );
  }

  return applicationId;
}

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

export function parseOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }

  return value.trim();
}

export function parseOptionalStringArray({ value, fieldName }: { value: unknown; fieldName: string }): string[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const entries = typeof value === 'string' ? value.split(',') : value;
  if (!Array.isArray(entries)) {
    throw new Error(`${fieldName} must be a list of attribute names.`);
  }

  const parsed = entries
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length > 0);

  return parsed.length > 0 ? parsed : undefined;
}

export function parseIntegerInRange({
  value,
  fieldName,
  min,
  max,
  defaultValue,
}: {
  value: unknown;
  fieldName: string;
  min: number;
  max: number;
  defaultValue: number;
}): number {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(
      max === Number.MAX_SAFE_INTEGER
        ? `${fieldName} must be a whole number of at least ${min}.`
        : `${fieldName} must be a whole number between ${min} and ${max}.`,
    );
  }

  return parsed;
}

export function parseAlgoliaRecord({ value, fieldName }: { value: unknown; fieldName: string }): AlgoliaRecord {
  if (!isAlgoliaRecord(value) || Object.keys(value).length === 0) {
    throw new Error(`${fieldName} must be a non-empty JSON object.`);
  }

  return value;
}

export function stripHighlights(record: AlgoliaRecord): AlgoliaRecord {
  return Object.fromEntries(
    Object.entries(record).filter(
      ([key]) => key !== '_highlightResult' && key !== '_snippetResult',
    ),
  );
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
