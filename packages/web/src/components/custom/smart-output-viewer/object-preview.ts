import { isNil, isObject } from '@activepieces/core-utils';
import { t } from 'i18next';

const IDENTIFIER_KEY = /^(id|uuid|object)$|_id$|Id$/;

const DISPLAY_KEYS = [
  'name',
  'title',
  'label',
  'text',
  'plain_text',
  'value',
  'start',
  'url',
  'email',
];

const UNKNOWN = '…';
const MAX_UNWRAP_DEPTH = 4;

type TypedEnvelope = { type: string; payload: unknown };

function asTypedEnvelope(value: Record<string, unknown>): TypedEnvelope | null {
  const type = value['type'];
  if (
    typeof type !== 'string' ||
    type === 'type' ||
    !Object.prototype.hasOwnProperty.call(value, type)
  ) {
    return null;
  }
  return { type, payload: value[type] };
}

function orderEntriesForPreview(
  value: Record<string, unknown>,
): [string, unknown][] {
  const entries = Object.entries(value);
  const meaningful = entries.filter(([key]) => !IDENTIFIER_KEY.test(key));
  if (meaningful.length === 0) {
    return entries;
  }
  return [
    ...meaningful,
    ...entries.filter(([key]) => IDENTIFIER_KEY.test(key)),
  ];
}

function summarizeValue(value: unknown, depth = 0): string | null {
  if (isNil(value) || value === '') {
    return null;
  }
  if (Array.isArray(value)) {
    return t('itemCount', { count: value.length });
  }
  if (isObject(value)) {
    if (depth >= MAX_UNWRAP_DEPTH) {
      return null;
    }
    const record = value as Record<string, unknown>;
    const envelope = asTypedEnvelope(record);
    if (envelope) {
      const unwrapped = summarizeValue(envelope.payload, depth + 1);
      if (!isNil(unwrapped)) {
        return unwrapped;
      }
    }
    for (const key of DISPLAY_KEYS) {
      const inner = record[key];
      if (
        !isNil(inner) &&
        inner !== '' &&
        !isObject(inner) &&
        !Array.isArray(inner)
      ) {
        return String(inner);
      }
    }
    return null;
  }
  return String(value);
}

export function previewObject(value: Record<string, unknown>): string {
  const envelope = asTypedEnvelope(value);
  if (envelope) {
    return `${envelope.type}: ${summarizeValue(envelope.payload) ?? UNKNOWN}`;
  }
  const entries = orderEntriesForPreview(value);
  const preview = entries
    .slice(0, 2)
    .map(([key, entry]) => `${key}: ${summarizeValue(entry) ?? UNKNOWN}`)
    .join(', ');
  return preview || t('fieldCount', { count: entries.length });
}
