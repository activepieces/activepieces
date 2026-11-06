function arrayPropValues({ value }: { value: unknown }): string[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    return undefined;
  }
  return value
    .map((entry) => {
      if (typeof entry === 'string') {
        return entry.trim();
      }
      if (typeof entry === 'object' && entry !== null) {
        const inner: unknown = Reflect.get(entry, 'value');
        return typeof inner === 'string' ? inner.trim() : typeof inner === 'number' ? String(inner) : '';
      }
      return typeof entry === 'number' ? String(entry) : '';
    })
    .filter((entry) => entry.length > 0);
}

function nonEmptyArrayPropValues({ value }: { value: unknown }): string[] | undefined {
  const values = arrayPropValues({ value });
  return values && values.length > 0 ? values : undefined;
}

function textValue({ value }: { value: unknown }): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

function stringList({ value, label, max = 20 }: { value: unknown; label: string; max?: number }): string[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = typeof value === 'string' ? parseJsonOrList({ value }) : value;
  if (!Array.isArray(parsed)) {
    throw new Error(`${label} must be a list of text values.`);
  }
  const values = parsed
    .map((entry) => (typeof entry === 'string' ? entry.trim() : typeof entry === 'number' ? String(entry) : null))
    .filter((entry): entry is string => entry !== null && entry.length > 0);
  if (values.length !== parsed.length) {
    throw new Error(`${label} must only contain non-empty text values.`);
  }
  if (values.length > max) {
    throw new Error(`${label} accepts at most ${max} values; got ${values.length}.`);
  }
  return values;
}

function idList({ value, label, prefix, max = 100 }: { value: unknown; label: string; prefix: string; max?: number }): string[] | undefined {
  const values = stringList({ value, label, max });
  if (values === undefined) {
    return undefined;
  }
  for (const id of values) {
    if (!id.startsWith(prefix) || !/^[A-Za-z0-9_-]+$/.test(id)) {
      throw new Error(`${label} must contain Folk IDs starting with "${prefix}"; "${id}" is not one.`);
    }
  }
  return values;
}

function jsonObject({ value, label }: { value: unknown; label: string }): Record<string, unknown> | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = typeof value === 'string' ? parseJson({ value, label }) : value;
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return Object.fromEntries(Object.entries(parsed));
}

function customFieldValues({ value }: { value: unknown }): Record<string, unknown> | undefined {
  const parsed = jsonObject({ value, label: 'Custom Field Values' });
  if (parsed === undefined) {
    return undefined;
  }
  for (const [groupId, fields] of Object.entries(parsed)) {
    if (!groupId.startsWith('grp_')) {
      throw new Error(
        `Custom Field Values must be keyed by group ID (grp_...), then field name, e.g. {"grp_123": {"Status": "Lead"}}. "${groupId}" is not a group ID.`
      );
    }
    if (typeof fields !== 'object' || fields === null || Array.isArray(fields)) {
      throw new Error(`Custom Field Values for ${groupId} must be an object of field name to value.`);
    }
  }
  return parsed;
}

function limitValue({ value, fallback = 20 }: { value: unknown; fallback?: number }): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
    throw new Error('Limit must be a whole number from 1 to 100.');
  }
  return parsed;
}

function cursorValue({ value }: { value: unknown }): string | undefined {
  const text = textValue({ value });
  if (text === undefined) {
    return undefined;
  }
  if (/^https?:\/\//i.test(text)) {
    const cursor = cursorFromUrl({ url: text });
    if (!cursor) {
      throw new Error('The cursor link has no "cursor" parameter. Pass the Next Cursor value from the previous result.');
    }
    return cursor;
  }
  if (text.length > 512) {
    throw new Error('Cursor is too long. Pass the Next Cursor value from the previous result.');
  }
  return text;
}

function dateValue({ value, label }: { value: unknown; label: string }): string | undefined {
  const text = textValue({ value });
  if (text === undefined) {
    return undefined;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(`${text}T00:00:00Z`))) {
    throw new Error(`${label} must be a date in YYYY-MM-DD format.`);
  }
  return text;
}

function dateTimeValue({ value, label }: { value: unknown; label: string }): string | undefined {
  const text = textValue({ value });
  if (text === undefined) {
    return undefined;
  }
  const parsed = Date.parse(text);
  if (Number.isNaN(parsed)) {
    throw new Error(`${label} must be an ISO 8601 date-time, e.g. 2026-10-21T14:30:00Z.`);
  }
  return new Date(parsed).toISOString();
}

function idempotencyKeyValue({ value }: { value: unknown }): string | undefined {
  const text = textValue({ value });
  if (text !== undefined && text.length > 255) {
    throw new Error('Idempotency Key must be at most 255 characters.');
  }
  return text;
}

function isTrue({ value }: { value: unknown }): boolean {
  return value === true || value === 'true';
}

function parseJson({ value, label }: { value: string; label: string }): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${label} is not valid JSON.`);
  }
}

function parseJsonOrList({ value }: { value: string }): unknown {
  const trimmed = value.trim();
  if (trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return [trimmed];
    }
  }
  return [trimmed];
}

function cursorFromUrl({ url }: { url: string }): string | undefined {
  try {
    return new URL(url).searchParams.get('cursor') ?? undefined;
  } catch {
    return undefined;
  }
}

export const folkFields = {
  arrayPropValues,
  nonEmptyArrayPropValues,
  textValue,
  stringList,
  idList,
  jsonObject,
  customFieldValues,
  limitValue,
  cursorValue,
  dateValue,
  dateTimeValue,
  idempotencyKeyValue,
  isTrue,
};
