import { isRecord } from './client';

function rec(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function records(value: unknown): Record<string, unknown>[] {
  return list(value).filter(isRecord);
}

function str(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function optionalText(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const text = typeof value === 'string' ? value.trim() : String(value).trim();
  return text.length === 0 ? undefined : text;
}

function stringList({ value, label }: { value: unknown; label: string }): string[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  let items: unknown[];
  if (Array.isArray(value)) {
    items = value;
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        items = Array.isArray(parsed) ? parsed : [trimmed];
      } catch {
        items = trimmed.split(',');
      }
    } else {
      items = trimmed.length === 0 ? [] : trimmed.split(',');
    }
  } else {
    throw new Error(`${label} must be a list of text values.`);
  }
  const result: string[] = [];
  for (const item of items) {
    const text = isRecord(item) ? optionalText(Object.values(item)[0]) : optionalText(item);
    if (text !== undefined && !result.includes(text)) {
      result.push(text);
    }
  }
  return result;
}

function integer({ value, label, min, max }: { value: unknown; label: string; min: number; max: number }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = typeof value === 'string' ? Number(value.trim()) : value;
  if (typeof parsed !== 'number' || !Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} must be a whole number from ${min} to ${max}.`);
  }
  return parsed;
}

function bool(value: unknown): boolean | undefined {
  if (Array.isArray(value)) {
    return bool(value[0]);
  }
  if (value === true || value === 'true') {
    return true;
  }
  if (value === false || value === 'false') {
    return false;
  }
  return undefined;
}

function isoDate({ value, label }: { value: unknown; label: string }): string | undefined {
  const text = optionalText(value);
  if (text === undefined) {
    return undefined;
  }
  const time = Date.parse(text);
  if (Number.isNaN(time)) {
    throw new Error(`${label} must be a date, for example 2026-10-01 or 2026-10-01T09:00:00Z.`);
  }
  return new Date(time).toISOString();
}

export const workableValues = { rec, list, records, str, optionalText, stringList, integer, bool, isoDate };
