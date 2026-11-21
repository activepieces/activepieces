import { Property } from '@activepieces/pieces-framework';
import { sprinklrErrors } from './errors';

function caseNumberProp() {
  return Property.ShortText({
    displayName: 'Case Number',
    description: 'The number shown next to # on the case in Sprinklr.',
    placeholder: '120338341',
    required: true,
  });
}

function parseCaseNumber(value: unknown): string {
  const raw = typeof value === 'number' && Number.isFinite(value) ? String(value) : typeof value === 'string' ? value : '';
  const cleaned = raw.trim().replace(/^#/, '').trim();
  if (!/^\d+$/.test(cleaned)) {
    throw new Error(
      `Case Number must be the number of a Sprinklr case, like 120338341, but it was "${raw}". Copy it from the case in Sprinklr.`
    );
  }
  return cleaned;
}

function cleanText(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseId({ value, field }: { value: unknown; field: string }): number {
  const text = cleanText(value);
  if (text === undefined || !/^\d+$/.test(text)) {
    throw new Error(`${field} must be a Sprinklr ID made of digits, like 103197, but it was "${String(value ?? '')}". Check the ID.`);
  }
  return Number(text);
}

function parseStructured({ value, field }: { value: unknown; field: string }): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const text = value.trim();
  if (!text.startsWith('[') && !text.startsWith('{')) {
    return value;
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${field} is not valid JSON. Check the value mapped into ${field}.`);
  }
}

function parseIdList({ value, field }: { value: unknown; field: string }): number[] | undefined {
  const parsed = parseStructured({ value, field });
  if (parsed === undefined || parsed === null || parsed === '') {
    return undefined;
  }
  const items = Array.isArray(parsed) ? parsed : typeof parsed === 'string' ? parsed.split(',') : [parsed];
  const ids = items.filter((item) => cleanText(item) !== undefined).map((item) => parseId({ value: item, field }));
  return ids.length > 0 ? ids : undefined;
}

function customFieldValue({ key, value }: { key: string; value: unknown }): string[] {
  const items = Array.isArray(value) ? value : [value];
  return items.flatMap((item) => {
    if (item === undefined || item === null) {
      return [];
    }
    if (typeof item === 'string') {
      return item.trim().length > 0 ? [item] : [];
    }
    if (typeof item === 'number' || typeof item === 'boolean') {
      return [String(item)];
    }
    throw new Error(`Custom field "${key}" has a value that is not text. Give text or a list of text for each custom field.`);
  });
}

function customFieldsAsLists(input: unknown): Record<string, string[]> | undefined {
  const value = parseStructured({ value: input, field: 'Custom Fields' });
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (!sprinklrErrors.isRecord(value)) {
    throw new Error('Custom Fields must be pairs of a custom field name and its value. Check the Custom Fields input.');
  }
  const entries = Object.entries(value).flatMap(([rawKey, fieldValue]): Array<[string, string[]]> => {
    const key = rawKey.trim();
    if (key.length === 0) {
      return [];
    }
    const values = customFieldValue({ key, value: fieldValue });
    return values.length > 0 ? [[key, values]] : [];
  });
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function compact(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

export const sprinklrCaseWrite = {
  caseNumberProp,
  parseCaseNumber,
  cleanText,
  parseId,
  parseIdList,
  parseStructured,
  customFieldsAsLists,
  compact,
};
