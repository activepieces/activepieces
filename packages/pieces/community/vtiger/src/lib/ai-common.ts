import { Property } from '@activepieces/pieces-framework';
import { isRecord } from './rest-client';

export function moduleProp({ description }: { description?: string } = {}) {
  return Property.ShortText({
    displayName: 'Module',
    description:
      description ??
      'API name of the Vtiger module, for example Contacts, Leads, Accounts, Potentials or Cases. Get the exact names from List Modules.',
    required: true,
  });
}

export function recordIdProp({
  displayName = 'Record ID',
  description,
}: {
  displayName?: string;
  description?: string;
} = {}) {
  return Property.ShortText({
    displayName,
    description:
      description ??
      'Vtiger webservice ID of the record, for example 12x345. Get it from Search Module Records, Query Records or a previous create.',
    required: true,
  });
}

export function fieldsJsonProp({
  displayName = 'Fields',
  description,
  required,
}: {
  displayName?: string;
  description: string;
  required: boolean;
}) {
  return Property.Json({ displayName, description, required });
}

export function recordOutput(record: unknown): { id: string; record: Record<string, unknown> } {
  const value = isRecord(record) ? record : {};
  return { id: typeof value['id'] === 'string' ? value['id'] : '', record: value };
}

export function recordList(result: unknown): Record<string, unknown>[] {
  if (Array.isArray(result)) {
    return result.filter(isRecord);
  }
  if (isRecord(result) && Array.isArray(result['records'])) {
    return result['records'].filter(isRecord);
  }
  return [];
}

export function stringList({ value, label }: { value: unknown; label: string }): string[] {
  const raw = Array.isArray(value)
    ? value
    : typeof value === 'string'
    ? value.split(',')
    : [];
  const items = raw
    .map((item) => (typeof item === 'string' || typeof item === 'number' ? String(item).trim() : ''))
    .filter((item) => item !== '');
  if (items.length === 0) {
    throw new Error(`${label} must contain at least one value`);
  }
  return [...new Set(items)];
}

export function requiredText({ value, label }: { value: unknown; label: string }): string {
  const text = typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
  if (text === '') {
    throw new Error(`${label} is required`);
  }
  return text;
}

export function toUnixSeconds(value: unknown): number {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
  if (text === '') {
    throw new Error('Modified Since is required: Unix seconds (e.g. 1735689600) or an ISO 8601 date');
  }
  if (/^\d+$/.test(text)) {
    const n = Number(text);
    return n > 100000000000 ? Math.floor(n / 1000) : n;
  }
  const ms = Date.parse(text);
  if (Number.isNaN(ms)) {
    throw new Error(`Modified Since "${text}" is neither Unix seconds nor an ISO 8601 date`);
  }
  return Math.floor(ms / 1000);
}
