import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

function baseUrl(env: string): string {
  return env === 'sandbox'
    ? 'https://api.shiplogic.com/sandbox'
    : 'https://api.shiplogic.com';
}

export async function courierGuyRequest<T>(params: {
  auth: { api_key: string; environment?: string };
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  query?: Record<string, string | number>;
}): Promise<T> {
  const url = `${baseUrl(params.auth.environment ?? 'live')}${params.path}`;
  const request: HttpRequest = {
    method: params.method,
    url,
    headers: {
      Authorization: `Bearer ${params.auth.api_key}`,
      'Content-Type': 'application/json',
    },
    queryParams: params.query
      ? Object.fromEntries(Object.entries(params.query).map(([k, v]) => [k, String(v)]))
      : undefined,
    body: params.body,
  };
  const res = await httpClient.sendRequest<T>(request);
  return res.body;
}
