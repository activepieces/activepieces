import { createHmac } from 'node:crypto';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

export type IkhokhaAuth = {
  app_id: string;
  app_secret: string;
  sandbox?: boolean;
};

function baseUrl(sandbox: boolean): string {
  return sandbox
    ? 'https://api.uat.ikhokha.com'
    : 'https://api.ikhokha.com';
}

/**
 * iKhokha signs each request. The signing string is:
 *   METHOD + "\n" + PATH + "\n" + BODY_JSON
 * HMAC-SHA256 with the app secret, base64 encoded.
 */
export async function ikhokhaRequest<T>(params: {
  auth: IkhokhaAuth;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  query?: Record<string, string | number>;
}): Promise<T> {
  const bodyString = params.body ? JSON.stringify(params.body) : '';
  const signing = `${params.method}\n${params.path}\n${bodyString}`;
  const signature = createHmac('sha256', params.auth.app_secret)
    .update(signing)
    .digest('base64');

  const request: HttpRequest = {
    method: params.method,
    url: `${baseUrl(!!params.auth.sandbox)}${params.path}`,
    headers: {
      'IK-APPID': params.auth.app_id,
      'IK-SIGN': signature,
      'Content-Type': 'application/json',
    },
    queryParams: params.query
      ? Object.fromEntries(
          Object.entries(params.query).map(([k, v]) => [k, String(v)]),
        )
      : undefined,
    body: params.body,
  };

  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}
