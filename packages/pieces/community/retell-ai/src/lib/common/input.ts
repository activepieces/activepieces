import { isRecord } from './client';

export const retellInput = {
  seg,
  e164,
  optionalE164,
  optionalText,
  requiredText,
  optionalInteger,
  agentVersion,
  stringMap,
  objectValue,
  stringList,
  timestampMs,
  singleAgent,
  pageLimit,
  stringFilter,
  enumFilter,
};

function seg({ value, label }: { value: unknown; label: string }): string {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
  if (text.length === 0) {
    throw new Error(`${label} is required.`);
  }
  if (text === '.' || text === '..' || text.includes('/') || text.includes('\\')) {
    throw new Error(`${label} "${text}" is not a valid Retell AI ID.`);
  }
  return encodeURIComponent(text);
}

function e164({ value, label }: { value: unknown; label: string }): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!E164.test(text)) {
    throw new Error(`${label} must be in E.164 format, for example +14157774444.`);
  }
  return text;
}

function optionalE164({ value, label }: { value: unknown; label: string }): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return e164({ value, label });
}

function requiredText({ value, label }: { value: unknown; label: string }): string {
  const text = optionalText(value);
  if (text === undefined) {
    throw new Error(`${label} is required.`);
  }
  return text;
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function optionalInteger({
  value,
  label,
  min,
  max,
}: {
  value: unknown;
  label: string;
  min?: number;
  max?: number;
}): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isInteger(parsed)) {
    throw new Error(`${label} must be a whole number.`);
  }
  if ((min !== undefined && parsed < min) || (max !== undefined && parsed > max)) {
    throw new Error(`${label} must be between ${min ?? '-∞'} and ${max ?? '∞'}.`);
  }
  return parsed;
}

function agentVersion({ value, label }: { value: unknown; label: string }): number | string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'number') {
    return optionalInteger({ value, label, min: 0 });
  }
  const text = String(value).trim();
  if (text.length === 0) {
    return undefined;
  }
  return /^\d+$/.test(text) ? Number(text) : text;
}

function stringMap({ value, label }: { value: unknown; label: string }): Record<string, string> | undefined {
  const record = objectValue({ value, label });
  if (record === undefined) {
    return undefined;
  }
  const result: Record<string, string> = {};
  for (const [key, item] of Object.entries(record)) {
    if (item === undefined || item === null) {
      continue;
    }
    result[key] = typeof item === 'string' ? item : typeof item === 'object' ? JSON.stringify(item) : String(item);
  }
  return result;
}

function objectValue({ value, label }: { value: unknown; label: string }): Record<string, unknown> | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return undefined;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error(`${label} must be a JSON object.`);
    }
    if (!isRecord(parsed)) {
      throw new Error(`${label} must be a JSON object.`);
    }
    return parsed;
  }
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value;
}

function stringList({ value, label, max }: { value: unknown; label: string; max?: number }): string[] {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  const raw = Array.isArray(value) ? value : [value];
  const items = raw
    .flatMap((item) => (Array.isArray(item) ? item : [item]))
    .map((item) => (typeof item === 'string' ? item.trim() : typeof item === 'number' ? String(item) : ''))
    .filter((item) => item.length > 0);
  if (max !== undefined && items.length > max) {
    throw new Error(`${label} accepts at most ${max} entries.`);
  }
  return items;
}

function timestampMs({ value, label }: { value: unknown; label: string }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'number') {
    return value < 100000000000 ? value * 1000 : value;
  }
  const text = String(value).trim();
  if (/^\d+$/.test(text)) {
    const parsed = Number(text);
    return parsed < 100000000000 ? parsed * 1000 : parsed;
  }
  const parsed = Date.parse(text);
  if (Number.isNaN(parsed)) {
    throw new Error(`${label} must be an ISO date or a Unix timestamp.`);
  }
  return parsed;
}

function singleAgent({ agentId, version, label }: { agentId: unknown; version: unknown; label: string }) {
  const id = optionalText(agentId);
  if (id === undefined) {
    return undefined;
  }
  const parsedVersion = agentVersion({ value: version, label: `${label} Version` });
  return [{ agent_id: id, ...(parsedVersion === undefined ? {} : { agent_version: parsedVersion }), weight: 1 }];
}

function pageLimit(value: unknown): number {
  return optionalInteger({ value, label: 'Limit', min: 1, max: 1000 }) ?? 50;
}

function stringFilter(value: string) {
  return { type: 'string', op: 'eq', value };
}

function enumFilter({ value, label, allowed }: { value: unknown; label: string; allowed: readonly string[] }) {
  const items = stringList({ value: typeof value === 'string' ? value.split(',') : value, label });
  if (items.length === 0) {
    return undefined;
  }
  const invalid = items.filter((item) => !allowed.includes(item));
  if (invalid.length > 0) {
    throw new Error(`${label} has unknown values: ${invalid.join(', ')}. Allowed: ${allowed.join(', ')}.`);
  }
  return { type: 'enum', op: 'in', value: items };
}

const E164 = /^\+[1-9]\d{1,14}$/;

