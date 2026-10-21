import { isRecord } from './client';

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function listFrom({ body, key }: { body: unknown; key?: string }): Record<string, unknown>[] {
  if (Array.isArray(body)) {
    return records(body);
  }
  if (isRecord(body)) {
    if (key !== undefined && Array.isArray(body[key])) {
      return records(body[key]);
    }
    if (Array.isArray(body['data'])) {
      return records(body['data']);
    }
  }
  return [];
}

function page({
  items,
  offset,
  limit,
}: {
  items: Record<string, unknown>[];
  offset: number;
  limit: number;
}): { items: Record<string, unknown>[]; count: number; offset: number; has_more: boolean } {
  return { items, count: items.length, offset, has_more: items.length >= limit };
}

function numberField({ body, key }: { body: unknown; key: string }): number | undefined {
  if (!isRecord(body)) {
    return undefined;
  }
  const value = body[key];
  return typeof value === 'number' ? value : undefined;
}

export const lemlistResults = { records, listFrom, page, numberField };
