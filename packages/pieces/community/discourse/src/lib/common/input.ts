function id({ value, label }: { value: unknown; label: string }): string {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
  if (!/^\d{1,18}$/.test(text)) {
    throw new Error(`${label} must be a positive whole number, for example 42.`);
  }
  return text;
}

function optionalId({ value, label }: { value: unknown; label: string }): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return id({ value, label });
}

function name({ value, label }: { value: unknown; label: string }): string {
  const text = typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
  if (text.length === 0) {
    throw new Error(`${label} is required.`);
  }
  if (text === '.' || text === '..' || text.includes('/') || text.includes('\\')) {
    throw new Error(`${label} "${text}" is not valid.`);
  }
  return encodeURIComponent(text);
}

function text({ value, label }: { value: unknown; label: string }): string {
  const result = typeof value === 'string' ? value.trim() : '';
  if (result.length === 0) {
    throw new Error(`${label} is required.`);
  }
  return result;
}

function markdown({ value, label }: { value: unknown; label: string }): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} is required.`);
  }
  return value;
}

function secret({ value, label }: { value: unknown; label: string }): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} is required.`);
  }
  return value;
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const result = value.trim();
  return result.length === 0 ? undefined : result;
}

function stringList({ value, label, required }: { value: unknown; label: string; required: boolean }): string[] {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  const items = raw
    .flatMap((item) => (Array.isArray(item) ? item : [item]))
    .map((item) => (typeof item === 'string' ? item.trim() : typeof item === 'number' ? String(item) : ''))
    .filter((item) => item.length > 0);
  const unique = [...new Set(items)];
  if (required && unique.length === 0) {
    throw new Error(`${label} needs at least one value.`);
  }
  if (unique.some((item) => item.includes(','))) {
    throw new Error(`${label} entries must not contain commas.`);
  }
  return unique;
}

function boundedNumber({
  value,
  label,
  min,
  max,
  fallback,
}: {
  value: unknown;
  label: string;
  min: number;
  max: number;
  fallback: number;
}): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} must be a whole number from ${min} to ${max}.`);
  }
  return parsed;
}

function optionalBoolean(value: unknown): boolean | undefined {
  if (value === true || value === 'true') {
    return true;
  }
  if (value === false || value === 'false') {
    return false;
  }
  return undefined;
}

function isoDate({ value, label }: { value: unknown; label: string }): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = new Date(typeof value === 'string' || typeof value === 'number' ? value : NaN);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${label} must be a valid date, for example 2026-12-31T00:00:00Z.`);
  }
  return parsed.toISOString();
}

export const discourseInput = {
  secret,
  id,
  optionalId,
  name,
  text,
  markdown,
  optionalText,
  stringList,
  boundedNumber,
  optionalBoolean,
  isoDate,
};
