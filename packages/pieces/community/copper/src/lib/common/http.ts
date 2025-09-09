import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { CopperAuth } from './auth';

export const COPPER_BASE_URL = 'https://api.copper.com/developer_api/v1';

export async function copperRequest<T = unknown>(args: {
  auth: CopperAuth | unknown;
  method: HttpMethod;
  url: string;
  query?: Record<string, unknown>;
  body?: unknown;
}) {
  const { auth, method, url, query, body } = args;
  const a = auth as CopperAuth;

  const request: HttpRequest = {
    method,
    url: `${COPPER_BASE_URL}${url}`,
    headers: {
      'X-PW-AccessToken': a.api_key,
      'X-PW-UserEmail': a.email,
      'X-PW-Application': 'developer_api',
      'Content-Type': 'application/json',
    },
    queryParams: query,
    body,
  };

  const res = await httpClient.sendRequest<T>(request);
  return res.body as T;
}

