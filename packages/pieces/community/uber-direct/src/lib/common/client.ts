import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

function baseUrl(env: string): string {
  return env === 'sandbox'
    ? 'https://sandbox-api.uber.com/v1'
    : 'https://api.uber.com/v1';
}

export async function uberDirectRequest<T>(params: {
  auth: { customer_id: string; server_token: string; environment?: string };
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
}): Promise<T> {
  const url = `${baseUrl(params.auth.environment ?? 'live')}/customers/${params.auth.customer_id}${params.path}`;
  const request: HttpRequest = {
    method: params.method,
    url,
    headers: {
      Authorization: `Bearer ${params.auth.server_token}`,
      'Content-Type': 'application/json',
    },
    body: params.body,
  };
  const res = await httpClient.sendRequest<T>(request);
  return res.body;
}
