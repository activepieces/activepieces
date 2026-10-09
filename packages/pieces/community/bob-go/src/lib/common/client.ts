import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

const BASE = 'https://api.bobgo.co.za';

export async function bobGoRequest<T>(params: {
  auth: { api_token: string; account_id?: string };
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  query?: Record<string, string | number>;
}): Promise<T> {
  const request: HttpRequest = {
    method: params.method,
    url: `${BASE}${params.path}`,
    headers: {
      Authorization: `Bearer ${params.auth.api_token}`,
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
