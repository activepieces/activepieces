import {
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';

export const SALESLOFT_API_BASE = 'https://api.salesloft.com/v2';

export async function salesloftRequest<T = unknown>({
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
}): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${SALESLOFT_API_BASE}${path}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    queryParams,
    body,
  });
  return response.body;
}

/**
 * Remove undefined/null/empty-string values from an object before sending
 * as a request body.
 */
export function cleanPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).filter(
      ([, v]) => v !== undefined && v !== null && v !== '',
    ),
  );
}
