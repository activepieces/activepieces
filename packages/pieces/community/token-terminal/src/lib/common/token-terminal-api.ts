import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

export const BASE_URL = 'https://api.tokenterminal.com/v2';

export const tokenTerminalAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Token Terminal API key. Get one at https://tokenterminal.com/terminal/profile/api',
  required: true,
});

export async function makeRequest(
  apiKey: string,
  method: HttpMethod,
  endpoint: string,
  queryParams?: Record<string, string>
) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.append(key, value);
      }
    });
  }

  const response = await httpClient.sendRequest({
    method,
    url: url.toString(),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  return response.body;
}
