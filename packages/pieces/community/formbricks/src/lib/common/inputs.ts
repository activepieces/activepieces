import { isRecord } from './client';

function clampInt({ value, min, max, fallback }: { value: number | null | undefined; min: number; max: number; fallback: number }): number {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function requiredString({ value, label }: { value: unknown; label: string }): string {
  const result = optionalString(value);
  if (result === undefined) {
    throw new Error(`${label} is required.`);
  }
  return result;
}

function optionalDate({ value, label }: { value: unknown; label: string }): string | undefined {
  const text = optionalString(value);
  if (text === undefined) {
    return undefined;
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${label} must be a date such as 2026-01-31 or 2026-01-31T12:00:00Z.`);
  }
  return parsed.toISOString();
}

function answers({ value, required }: { value: unknown; required: boolean }): Record<string, unknown> | undefined {
  const parsed = typeof value === 'string' && value.trim().length > 0 ? parseJson(value) : value;
  if (parsed === undefined || parsed === null || (isRecord(parsed) && Object.keys(parsed).length === 0)) {
    if (required) {
      throw new Error('Provide at least one answer, keyed by question ID (use Get Survey to see the question IDs).');
    }
    return undefined;
  }
  if (!isRecord(parsed)) {
    throw new Error('Answers must be an object keyed by question ID, for example {"q1abc": "Great product"}.');
  }
  return parsed;
}

function stringRecord(value: unknown): Record<string, string> {
  const parsed = typeof value === 'string' && value.trim().length > 0 ? parseJson(value) : value;
  if (!isRecord(parsed)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(parsed)
      .filter(([, item]) => item !== undefined && item !== null && String(item).trim().length > 0)
      .map(([key, item]) => [key.trim(), typeof item === 'string' ? item : JSON.stringify(item)]),
  );
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('The value is not valid JSON.');
  }
}

export const formbricksInputs = {
  clampInt,
  optionalString,
  requiredString,
  optionalDate,
  answers,
  stringRecord,
};

export const SURVEY_STATUS_FILTER_OPTIONS = ['draft', 'scheduled', 'inProgress', 'paused', 'completed'].map((status) => ({
  label: status,
  value: status,
}));

export const SURVEY_STATUS_CHANGE_OPTIONS = [
  { label: 'In progress (resume collecting responses)', value: 'inProgress' },
  { label: 'Paused', value: 'paused' },
  { label: 'Completed (stop collecting responses)', value: 'completed' },
];
