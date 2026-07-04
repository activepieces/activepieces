import { httpClient, HttpMethod } from '@activepieces/pieces-common';

type TwentyAuth = {
  props: {
    base_url: string;
    api_key: string;
  };
};

function getBaseUrl(auth: TwentyAuth): string {
  return auth.props.base_url.replace(/\/$/, '');
}

function getHeaders(auth: TwentyAuth): Record<string, string> {
  return {
    Authorization: `Bearer ${auth.props.api_key}`,
    'Content-Type': 'application/json',
  };
}

export async function twentyRequest<T = unknown>(
  auth: TwentyAuth,
  method: HttpMethod,
  path: string,
  body?: unknown,
  queryParams?: Record<string, string>,
): Promise<T> {
  const response = await httpClient.sendRequest({
    method,
    url: `${getBaseUrl(auth)}${path}`,
    headers: getHeaders(auth),
    body,
    queryParams,
  });
  return response.body as T;
}

export function parseSingleRecord(body: unknown): Record<string, unknown> {
  const data = body as Record<string, unknown>;
  if (data?.['data'] != null && typeof data['data'] === 'object' && !Array.isArray(data['data'])) {
    return data['data'] as Record<string, unknown>;
  }
  return data;
}

export function parseRecords(body: unknown): Record<string, unknown>[] {
  const data = body as Record<string, unknown>;
  const items = data?.['data'] ?? body;
  if (Array.isArray(items)) return items;
  const nested = items as Record<string, unknown>;
  const firstArrayValue = Object.values(nested).find((v) => Array.isArray(v));
  return (firstArrayValue as Record<string, unknown>[]) ?? [];
}
