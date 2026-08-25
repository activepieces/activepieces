import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export const BASE_URL = 'https://sofya.co/v1';

type MakeRequestParams = {
  token: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
};

export async function makeRequest<T = unknown>({
  token,
  method,
  path,
  body,
}: MakeRequestParams): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });
  return response.body;
}
