import { HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';

export const REPLY_IO_API_ROOT = 'https://api.reply.io';


export function buildReplyIoHeaders(apiKey: string, includeJsonContentType = false) {
  return {
    'Api-Key': apiKey,
    'X-Api-Key': apiKey,
    ...(includeJsonContentType ? { 'Content-Type': 'application/json' } : {}),
  };
}

function removeUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, current]) => current !== undefined && current !== null && current !== '',
    ),
  ) as T;
}

export async function replyIoRequest({
  apiKey,
  method,
  path,
  queryParams,
  body,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  queryParams?: QueryParams;
  body?: unknown;
}) {
  return httpClient.sendRequest({
    method,
    url: `${REPLY_IO_API_ROOT}${path}`,
    headers: buildReplyIoHeaders(apiKey, body !== undefined),
    queryParams,
    body,
  });
}

export function cleanPayload(payload: Record<string, unknown>) {
  return removeUndefined(payload);
}

export function extractCollection<T = Record<string, unknown>>(body: unknown): T[] {
  if (Array.isArray(body)) {
    return body as T[];
  }

  if (!body || typeof body !== 'object') {
    return [];
  }

  const record = body as Record<string, unknown>;
  const wrapperKeys = ['results', 'items', 'campaigns', 'people'];

  for (const key of wrapperKeys) {
    const candidate = record[key];
    if (Array.isArray(candidate)) {
      return candidate as T[];
    }
  }

  return [];
}
