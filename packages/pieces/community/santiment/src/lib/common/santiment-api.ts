import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const SANTIMENT_API_URL = 'https://api.santiment.net/graphql';

export async function santimentRequest(
  apiKey: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<unknown> {
  const response = await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: SANTIMENT_API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Apikey ${apiKey}`,
    },
    body: {
      query,
      variables: variables ?? {},
    },
  });
  return response.body;
}
