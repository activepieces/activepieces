import { Property } from '@activepieces/pieces-framework';
import { isRecord } from './client';

function id({ displayName, description }: { displayName: string; description: string }) {
  return Property.ShortText({ displayName, description, required: true });
}

function optionalId({ displayName, description }: { displayName: string; description: string }) {
  return Property.ShortText({ displayName, description, required: false });
}

function text({ displayName, description, required }: { displayName: string; description: string; required: boolean }) {
  return Property.ShortText({ displayName, description, required });
}

function textList({ displayName, description, required }: { displayName: string; description: string; required: boolean }) {
  return Property.Array({ displayName, description, required });
}

function yesNo({ displayName, description }: { displayName: string; description: string }) {
  return Property.StaticDropdown<string>({
    displayName,
    description,
    required: false,
    options: {
      disabled: false,
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    },
  });
}

function choice({ displayName, description, required, options }: { displayName: string; description: string; required: boolean; options: { label: string; value: string }[] }) {
  return Property.StaticDropdown<string>({
    displayName,
    description,
    required,
    options: { disabled: false, options },
  });
}

function page() {
  return Property.Number({
    displayName: 'Page',
    description: 'Page number, starting at 1 (default 1). Apollo returns at most 500 pages.',
    required: false,
  });
}

function perPage({ max, fallback }: { max: number; fallback: number }) {
  return Property.Number({
    displayName: 'Results Per Page',
    description: `How many results to return per page, 1-${max} (default ${fallback}).`,
    required: false,
  });
}

function typedCustomFields({ modality }: { modality: string }) {
  return Property.Json({
    displayName: 'Custom Field Values',
    description: `JSON object mapping ${modality} custom field IDs (from List Custom Fields, field id) to values, e.g. {"60c39ed82bd02f01154c470a": "Q3 event"}. Picklist fields take option IDs, not labels. Leave empty to change nothing.`,
    required: false,
  });
}

function optionalText(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const textValue = String(value).trim();
  return textValue === '' ? undefined : textValue;
}

function requireText({ value, label }: { value: unknown; label: string }): string {
  const textValue = optionalText(value);
  if (textValue === undefined) {
    throw new Error(`${label} is required.`);
  }
  return textValue;
}

function optionalInteger({ value, label, min, max }: { value: unknown; label: string; min: number; max: number }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue < min || numberValue > max) {
    throw new Error(`${label} must be a whole number between ${min} and ${max}.`);
  }
  return numberValue;
}

function pageParams({ page: pageValue, perPage: perPageValue, maxPerPage, defaultPerPage }: { page: unknown; perPage: unknown; maxPerPage: number; defaultPerPage: number }): { page: number; perPage: number } {
  return {
    page: optionalInteger({ value: pageValue, label: 'Page', min: 1, max: MAX_PAGE }) ?? 1,
    perPage: optionalInteger({ value: perPageValue, label: 'Results Per Page', min: 1, max: maxPerPage }) ?? defaultPerPage,
  };
}

function stringList(value: unknown): string[] {
  const items = Array.isArray(value) ? value : typeof value === 'string' ? jsonArrayOrSingle(value) : value === undefined || value === null ? [] : [value];
  const texts = items.map((item) => (isRecord(item) ? Object.values(item)[0] : item)).map((item) => optionalText(item)).filter((item): item is string => item !== undefined);
  return [...new Set(texts)];
}

function jsonArrayOrSingle(value: string): unknown[] {
  const trimmed = value.trim();
  if (trimmed.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return [value];
    }
  }
  return [value];
}

function requireStringList({ value, label, max }: { value: unknown; label: string; max: number }): string[] {
  const list = stringList(value);
  if (list.length === 0) {
    throw new Error(`${label}: enter at least one value.`);
  }
  if (list.length > max) {
    throw new Error(`${label}: enter at most ${max} values (got ${list.length}).`);
  }
  return list;
}

function yesNoValue(value: unknown): boolean | undefined {
  if (value === true || value === 'yes' || value === 'true') {
    return true;
  }
  if (value === false || value === 'no' || value === 'false') {
    return false;
  }
  return undefined;
}

function isoDateTime({ value, label }: { value: unknown; label: string }): string {
  const textValue = requireText({ value, label });
  const match = ISO_DATE_TIME.exec(textValue);
  if (!match || !isCalendarDate({ year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }) || Number.isNaN(Date.parse(textValue))) {
    throw new Error(`${label} must be an ISO 8601 date-time with a time zone, e.g. 2026-11-20T15:00:00Z (got "${textValue.slice(0, 40)}").`);
  }
  return new Date(textValue).toISOString();
}

function ymdDate({ value, label }: { value: unknown; label: string }): string | undefined {
  const textValue = optionalText(value);
  if (textValue === undefined) {
    return undefined;
  }
  const match = YMD_DATE.exec(textValue);
  if (!match || !isCalendarDate({ year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) })) {
    throw new Error(`${label} must be a real calendar date in YYYY-MM-DD format (got "${textValue.slice(0, 40)}").`);
  }
  return textValue;
}

function decimalAmount({ value, label }: { value: unknown; label: string }): string | undefined {
  const textValue = optionalText(value);
  if (textValue === undefined) {
    return undefined;
  }
  if (!DECIMAL.test(textValue)) {
    throw new Error(`${label} must be a plain number without currency symbols or thousands separators, e.g. 15000 or 15000.50 (got "${textValue.slice(0, 40)}").`);
  }
  return textValue;
}

function customFields(value: unknown): Record<string, CustomFieldValue> | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = typeof value === 'string' ? parseJson(value) : value;
  if (!isRecord(parsed)) {
    throw new Error('Custom Field Values must be a JSON object mapping custom field IDs to values.');
  }
  const entries = Object.entries(parsed);
  if (entries.length === 0) {
    return undefined;
  }
  const result: Record<string, CustomFieldValue> = {};
  for (const [key, fieldValue] of entries) {
    if (!isCustomFieldValue(fieldValue)) {
      throw new Error(`Custom field "${key.slice(0, 40)}" must be a string, number, boolean, null or a list of strings.`);
    }
    result[key] = fieldValue;
  }
  return result;
}

function compact(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}

function isCustomFieldValue(value: unknown): value is CustomFieldValue {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return true;
  }
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function parseJson(value: string): unknown {
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed;
  } catch {
    throw new Error('Custom Field Values must be valid JSON.');
  }
}

function isCalendarDate({ year, month, day }: { year: number; month: number; day: number }): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

const MAX_PAGE = 500;

const ISO_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d(\.\d{1,3})?)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d)$/;

const YMD_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const DECIMAL = /^\d{1,15}(\.\d{1,2})?$/;

export const aiProps = {
  id,
  optionalId,
  text,
  textList,
  yesNo,
  choice,
  page,
  perPage,
  typedCustomFields,
};

export const apolloInputs = {
  optionalText,
  requireText,
  optionalInteger,
  pageParams,
  stringList,
  requireStringList,
  yesNoValue,
  isoDateTime,
  ymdDate,
  decimalAmount,
  customFields,
  compact,
};

export type CustomFieldValue = string | number | boolean | null | string[];
