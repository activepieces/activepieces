import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.bochaai.com/v1';

export async function makeRequest({
  token,
  method,
  path,
  body,
}: {
  token: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
}) {
  const response = await httpClient.sendRequest({
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
