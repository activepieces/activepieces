import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const NANSEN_BASE_URL = 'https://api.nansen.ai/api/v1';

export async function nansenRequest<T>(
  apiKey: string,
  path: string,
  body: Record<string, unknown> = {}
): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.POST,
    url: `${NANSEN_BASE_URL}${path}`,
    headers: {
      'apikey': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body,
  });

  return response.body;
}
