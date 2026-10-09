import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

export const YOCO_BASE = 'https://online.yoco.com/v1';

export async function yocoRequest<T>(params: {
  secretKey: string;
  method: HttpMethod;
  path: string;
  query?: Record<string, string | number>;
  body?: Record<string, unknown>;
}): Promise<T> {
  const request: HttpRequest = {
    method: params.method,
    url: `${YOCO_BASE}${params.path}`,
    headers: {
      Authorization: `Bearer ${params.secretKey}`,
      'Content-Type': 'application/json',
    },
    queryParams: params.query
      ? Object.fromEntries(Object.entries(params.query).map(([k, v]) => [k, String(v)]))
      : undefined,
    body: params.body,
  };
  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}
