function text(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function requireText({ value, label }: { value: unknown; label: string }): string {
  const result = text(value);
  if (result === undefined) {
    throw new Error(`${label} is required.`);
  }
  return result;
}

function requireId({ value, label }: { value: unknown; label: string }): string {
  const id = requireText({ value, label });
  if (id.length > 192 || /[\s/\\?#]/.test(id)) {
    throw new Error(`${label} "${id.slice(0, 80)}" is not a valid Square ID.`);
  }
  return id;
}

function optionalId({ value, label }: { value: unknown; label: string }): string | undefined {
  return text(value) === undefined ? undefined : requireId({ value, label });
}

function idList({ value, label, max }: { value: unknown; label: string; max: number }): string[] {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  const ids = raw.map((item) => text(item)).filter((item): item is string => item !== undefined);
  const unique = [...new Set(ids)];
  if (unique.length > max) {
    throw new Error(`${label} accepts at most ${max} IDs (got ${unique.length}).`);
  }
  return unique.map((id) => requireId({ value: id, label }));
}

function limit({ value, fallback, max }: { value: unknown; fallback: number; max: number }): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`Limit must be a whole number between 1 and ${max}.`);
  }
  return Math.min(parsed, max);
}

function dateTime({ value, label }: { value: unknown; label: string }): string | undefined {
  const raw = text(value);
  if (raw === undefined) {
    return undefined;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${label} "${raw.slice(0, 40)}" is not a valid date and time. Use ISO 8601, for example 2026-10-07T09:00:00Z.`);
  }
  return parsed.toISOString();
}

function dateOnly({ value, label }: { value: unknown; label: string }): string | undefined {
  const raw = text(value);
  if (raw === undefined) {
    return undefined;
  }
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(raw);
  if (!match || Number.isNaN(new Date(`${match[1]}T00:00:00Z`).getTime())) {
    throw new Error(`${label} "${raw.slice(0, 40)}" is not a valid date. Use YYYY-MM-DD.`);
  }
  return match[1];
}

function email({ value, label }: { value: unknown; label: string }): string | undefined {
  const raw = text(value);
  if (raw === undefined) {
    return undefined;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
    throw new Error(`${label} "${raw.slice(0, 80)}" is not a valid email address.`);
  }
  return raw;
}

function bool(value: unknown): boolean {
  return value === true || value === 'true';
}

function url({ value, label }: { value: unknown; label: string }): string | undefined {
  const raw = text(value);
  if (raw === undefined) {
    return undefined;
  }
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`${label} "${raw.slice(0, 80)}" is not a valid URL.`);
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`${label} must start with https:// or http://.`);
  }
  return raw;
}

function cursor(value: unknown): string | undefined {
  return text(value);
}

export const squareInputs = { text, requireText, requireId, optionalId, idList, limit, dateTime, dateOnly, email, bool, url, cursor };
