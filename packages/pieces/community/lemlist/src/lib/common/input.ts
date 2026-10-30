function requireText({ value, label }: { value: unknown; label: string }): string {
  const text = typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
  if (text.length === 0) {
    throw new Error(`${label} is required.`);
  }
  return text;
}

function optionalText(value: unknown): string | undefined {
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const text = value.trim();
  return text.length === 0 ? undefined : text;
}

function segment({ value, label }: { value: unknown; label: string }): string {
  const text = requireText({ value, label });
  if (text === '.' || text === '..' || /[\s/\\?#%]/.test(text)) {
    throw new Error(`${label} "${text}" contains characters that are not allowed.`);
  }
  return encodeURIComponent(text);
}

function email({ value, label }: { value: unknown; label: string }): string {
  const text = requireText({ value, label });
  if (!EMAIL_PATTERN.test(text)) {
    throw new Error(`${label} "${text}" is not a valid email address.`);
  }
  return text;
}

function emailSegment({ value, label }: { value: unknown; label: string }): string {
  return encodeURIComponent(email({ value, label }));
}

function idSegment({
  value,
  label,
  prefix,
}: {
  value: unknown;
  label: string;
  prefix?: string;
}): string {
  const text = requireText({ value, label });
  if (!ID_PATTERN.test(text) || (prefix !== undefined && !text.startsWith(`${prefix}_`))) {
    const expected = prefix === undefined ? 'a lemlist ID' : `a lemlist ID starting with ${prefix}_`;
    throw new Error(`${label} "${text}" is not ${expected}.`);
  }
  return encodeURIComponent(text);
}

function leadIdOrEmailSegment({ value, label }: { value: unknown; label: string }): string {
  const text = requireText({ value, label });
  return text.includes('@')
    ? emailSegment({ value: text, label })
    : idSegment({ value: text, label, prefix: 'lea' });
}

function contactIdOrEmailSegment({ value, label }: { value: unknown; label: string }): string {
  const text = requireText({ value, label });
  return text.includes('@') ? emailSegment({ value: text, label }) : segment({ value: text, label });
}

function emailOrDomainSegment({ value, label }: { value: unknown; label: string }): string {
  const text = requireText({ value, label });
  if (text.includes('@')) {
    return emailSegment({ value: text, label });
  }
  if (!DOMAIN_PATTERN.test(text)) {
    throw new Error(`${label} "${text}" is not a valid email address or domain.`);
  }
  return encodeURIComponent(text);
}

function boundedInt({
  value,
  label,
  min,
  max,
}: {
  value: unknown;
  label: string;
  min: number;
  max: number;
}): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} must be a whole number between ${min} and ${max}.`);
  }
  return parsed;
}

function isoDate({ value, label }: { value: unknown; label: string }): string {
  const text = requireText({ value, label });
  const time = Date.parse(text);
  if (Number.isNaN(time)) {
    throw new Error(`${label} "${text}" is not a valid ISO 8601 date.`);
  }
  return new Date(time).toISOString();
}

function stringRecord({ value, label }: { value: unknown; label: string }): Record<string, string> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object of name/value pairs.`);
  }
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value)) {
    const name = key.trim();
    if (name.length === 0 || raw === undefined || raw === null) {
      continue;
    }
    out[name] = typeof raw === 'string' ? raw : typeof raw === 'object' ? JSON.stringify(raw) : String(raw);
  }
  if (Object.keys(out).length === 0) {
    throw new Error(`${label} needs at least one name/value pair.`);
  }
  return out;
}

function stringList({ value, label }: { value: unknown; label: string }): string[] {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  const items = raw
    .map((item) => (typeof item === 'string' ? item.trim() : typeof item === 'number' ? String(item) : ''))
    .filter((item) => item.length > 0);
  if (items.length === 0) {
    throw new Error(`${label} needs at least one value.`);
  }
  return [...new Set(items)];
}

function pick({ record, keys }: { record: Record<string, unknown>; keys: readonly string[] }): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    out[key] = record[key];
  }
  return out;
}

function compact(record: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined || value === null) {
      continue;
    }
    if (typeof value === 'string') {
      const text = value.trim();
      if (text.length === 0) {
        continue;
      }
      out[key] = text;
      continue;
    }
    out[key] = value;
  }
  return out;
}

const EMAIL_PATTERN = /^[^\s@/\\?#]{1,200}@[^\s@/\\?#]{1,200}\.[^\s@/\\?#]{1,60}$/;
const DOMAIN_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,62}\.){1,10}[A-Za-z]{2,63}$/;
const ID_PATTERN = /^[A-Za-z0-9_-]{1,100}$/;

function triState(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const text = value.trim().toLowerCase();
  if (text === 'yes' || text === 'true') {
    return true;
  }
  if (text === 'no' || text === 'false') {
    return false;
  }
  return undefined;
}

export const lemlistInput = {
  triState,
  requireText,
  optionalText,
  segment,
  email,
  emailSegment,
  idSegment,
  leadIdOrEmailSegment,
  contactIdOrEmailSegment,
  emailOrDomainSegment,
  boundedInt,
  isoDate,
  stringRecord,
  stringList,
  compact,
  pick,
};
