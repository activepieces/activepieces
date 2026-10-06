import { HttpMethod } from '@activepieces/pieces-common';
import { FathomAuthValue } from './auth';
import { fathomClient, QueryValue } from './client';

async function listInSdkShape({
  auth,
  path,
  query,
  fields,
}: {
  auth: FathomAuthValue;
  path: string;
  query: Record<string, QueryValue>;
  fields: string[];
}): Promise<{ result: { limit: number | null; nextCursor: string | null; items: Record<string, unknown>[] } }> {
  const body = await fathomClient.requestObject({ auth, method: HttpMethod.GET, path, query });
  const rawItems = Array.isArray(body['items']) ? body['items'].filter(fathomClient.isRecord) : [];
  const limit = body['limit'];
  const cursor = body['next_cursor'];
  return {
    result: {
      limit: typeof limit === 'number' ? limit : null,
      nextCursor: typeof cursor === 'string' ? cursor : null,
      items: rawItems.map((item) => toCamelItem({ item, fields })),
    },
  };
}

function toCamelItem({ item, fields }: { item: Record<string, unknown>; fields: string[] }): Record<string, unknown> {
  const picked = Object.fromEntries(fields.map((field) => [field, item[field]]));
  return { ...picked, createdAt: isoWithMillis({ value: item['created_at'] }) };
}

function isoWithMillis({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

export const fathomLegacy = { listInSdkShape, isoWithMillis };
