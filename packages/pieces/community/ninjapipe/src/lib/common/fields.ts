import { NinjaPipeAuth, NinjaPipeRecord, ninjapipeClient } from './client';

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

function compact(input: Record<string, unknown>): NinjaPipeRecord {
  return Object.fromEntries(
    Object.entries(input)
      .filter(([, value]) => !isBlank(value))
      .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]),
  );
}

function withClears({ body, clear }: { body: NinjaPipeRecord; clear: unknown }): NinjaPipeRecord {
  const keys = Array.isArray(clear) ? clear.filter((key): key is string => typeof key === 'string') : [];
  const conflicts = keys.filter((key) => key in body);
  if (conflicts.length > 0) {
    throw new Error(`Fields cannot be set and cleared in the same step: ${conflicts.join(', ')}.`);
  }
  return { ...body, ...Object.fromEntries(keys.map((key) => [key, null])) };
}

function toNumber({ value, field }: { value: unknown; field: string }): number | undefined {
  if (isBlank(value)) return undefined;
  const parsed = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be a number.`);
  return parsed;
}

function toDateOnly({ value, field }: { value: unknown; field: string }): string | undefined {
  if (isBlank(value)) return undefined;
  const text = String(value).trim();
  const isoDate = /^(\d{4}-\d{2}-\d{2})/.exec(text);
  if (isoDate) return isoDate[1];
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) throw new Error(`${field} must be a date (YYYY-MM-DD).`);
  return parsed.toISOString().slice(0, 10);
}

function toStringList(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  const list = Array.isArray(value) ? value : [value];
  const cleaned = list
    .map((item) => (ninjapipeClient.isRecord(item) ? Object.values(item)[0] : item))
    .filter((item) => !isBlank(item))
    .map((item) => String(item).trim());
  return cleaned.length > 0 ? cleaned : undefined;
}

function readCustomFields(value: unknown): NinjaPipeRecord | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'string' ? parseJsonObject(value) : value;
  if (!ninjapipeClient.isRecord(parsed)) throw new Error('Custom Fields must be an object of field keys and values.');
  return Object.keys(parsed).length > 0 ? parsed : undefined;
}

function parseJsonObject(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Custom Fields must be valid JSON.');
  }
}

async function mergeCustomFields({
  auth,
  path,
  fields,
  operation,
}: {
  auth: NinjaPipeAuth;
  path: string;
  fields: unknown;
  operation: string;
}): Promise<NinjaPipeRecord | undefined> {
  const incoming = readCustomFields(fields);
  if (!incoming) return undefined;
  const current = await ninjapipeClient.getRecord({ auth, path, operation });
  const existing = ninjapipeClient.isRecord(current['fields']) ? current['fields'] : {};
  const merged = { ...existing, ...incoming };
  return Object.fromEntries(Object.entries(merged).filter(([, value]) => !isBlank(value)));
}

function requireChanges({ body, what }: { body: NinjaPipeRecord; what: string }): NinjaPipeRecord {
  if (Object.keys(body).length === 0) {
    throw new Error(`Nothing to update: set or clear at least one ${what} field.`);
  }
  return body;
}

export const ninjapipeFields = {
  isBlank,
  compact,
  withClears,
  toNumber,
  toDateOnly,
  toStringList,
  readCustomFields,
  mergeCustomFields,
  requireChanges,
};
