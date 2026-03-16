import {
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

export const cryptoquantAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your CryptoQuant API key. Get one at https://cryptoquant.com/',
  required: true,
});

export async function makeApiRequest<T>(
  apiKey: string,
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const queryString = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  const url = `https://api.cryptoquant.com/v1${endpoint}${queryString ? '?' + queryString : ''}`;

  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  return response.body;
}
