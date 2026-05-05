import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.pubrio.com';

export async function pubrioRequest(
  apiKey: string,
  method: HttpMethod,
  endpoint: string,
  body?: any
): Promise<unknown> {
  const key = String(apiKey);
  const response = await httpClient.sendRequest({
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'pubrio-api-key': key,
      'Content-Type': 'application/json',
    },
    body: body && Object.keys(body).length > 0 ? body : undefined,
  });

  return response.body;
}


