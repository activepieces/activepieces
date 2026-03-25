import { HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';

export const BREVO_API_BASE_URL = 'https://api.brevo.com/v3';

export async function brevoRequest<T = unknown>(params: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  queryParams?: QueryParams;
  body?: unknown;
}) {
  const response = await httpClient.sendRequest<T>({
    method: params.method,
    url: `${BREVO_API_BASE_URL}${params.path}`,
    queryParams: params.queryParams,
    body: params.body,
    headers: {
      'api-key': params.apiKey,
      accept: 'application/json',
      ...(params.body ? { 'content-type': 'application/json' } : {}),
    },
  });
  return response.body;
}

export function compactObject<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => {
      if (v === undefined || v === null) return false;
      if (typeof v === 'string' && v === '') return false;
      if (Array.isArray(v) && v.length === 0) return false;
      return true;
    }),
  );
}
