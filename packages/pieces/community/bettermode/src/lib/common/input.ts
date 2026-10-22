function requireText({ value, label }: { value: unknown; label: string }): string {
  const text = optionalText(value);
  if (text === undefined) {
    throw new Error(`${label} is required.`);
  }
  return text;
}

function optionalText(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function stringList({ value, label }: { value: unknown; label: string }): string[] {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  const raw: unknown[] = Array.isArray(value)
    ? value.flatMap((item) => (typeof item === 'string' ? item.split(',') : [item]))
    : typeof value === 'string'
      ? value.split(',')
      : [value];
  const items = raw.map((item) => {
    if (typeof item !== 'string' && typeof item !== 'number') {
      throw new Error(`${label} must contain only text values.`);
    }
    return optionalText(item);
  });
  return [...new Set(items.filter((item): item is string => item !== undefined))];
}

function limit({ value, fallback = DEFAULT_LIMIT }: { value: unknown; fallback?: number }): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_LIMIT) {
    throw new Error(`Limit must be a whole number between 1 and ${MAX_LIMIT}.`);
  }
  return parsed;
}

function optionalBoolean({ value, label }: { value: unknown; label: string }): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  throw new Error(`${label} must be true or false.`);
}

function email({ value, label }: { value: unknown; label: string }): string {
  const text = requireText({ value, label });
  if (!EMAIL_PATTERN.test(text)) {
    throw new Error(`${label} must be a valid email address.`);
  }
  return text;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const bettermodeInput = {
  requireText,
  optionalText,
  stringList,
  limit,
  optionalBoolean,
  email,
  MAX_LIMIT,
};
