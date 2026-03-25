import { HttpMethod, httpClient } from '@activepieces/pieces-common';

interface KommoAuth {
  subdomain: string;
  apiToken: string;
}

export async function makeRequest(
  auth: KommoAuth,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  const url = `https://${auth.subdomain}.kommo.com/api/v4${path}`;

  const response = await httpClient.sendRequest({
    method,
    url,
    headers: {
      Authorization: `Bearer ${auth.apiToken}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  return response.body;
}
