import { ActionReceiptEvent } from '@activepieces/shared';

export function deriveReceiptLabel(receipt: ActionReceiptEvent): string {
  for (const record of candidateRecords(receipt.output)) {
    for (const key of LABEL_KEYS) {
      const value = pickStringValue(record[key]);
      if (value) return value;
    }
  }
  return receipt.actionDisplayName;
}

function candidateRecords(output: unknown): Record<string, unknown>[] {
  const root = toRecord(output);
  if (!root) return [];
  const nested = Object.values(root).filter(isRecord);
  return [root, ...nested];
}

function toRecord(output: unknown): Record<string, unknown> | null {
  const value = typeof output === 'string' ? tryParseJson(output) : output;
  return isRecord(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function pickStringValue(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (Array.isArray(value)) {
    const parts = value.filter(
      (item): item is string => typeof item === 'string' && item.length > 0,
    );
    return parts.length > 0 ? parts.join(', ') : null;
  }
  return null;
}

const LABEL_KEYS = [
  'to',
  'recipient',
  'recipients',
  'email',
  'subject',
  'title',
  'name',
  'displayName',
  'id',
];
