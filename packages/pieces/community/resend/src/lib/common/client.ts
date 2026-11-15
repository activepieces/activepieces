import { AuthenticationType, HttpMethod, httpClient, QueryParams } from '@activepieces/pieces-common';

async function sendRequest<T>({
  auth,
  method,
  path,
  body,
  queryParams,
  headers,
}: {
  auth: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: QueryParams;
  headers?: Record<string, string>;
}): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${RESEND_BASE_URL}${path}`,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth },
    body,
    queryParams,
    headers,
  });
  return response.body;
}

export const resendClient = { sendRequest };
export const RESEND_BASE_URL = 'https://api.resend.com';
