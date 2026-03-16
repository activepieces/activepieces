import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export async function covalentRequest<T>(
  apiKey: string,
  path: string,
  queryParams: Record<string, string> = {}
): Promise<T> {
  const response = await httpClient.sendRequest<{
    data?: T;
    error?: boolean;
    error_message?: string;
  }>({
    method: HttpMethod.GET,
    url: `https://api.covalenthq.com/v1/${path}`,
    queryParams,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });

  const body = response.body;

  if (body.error) {
    throw new Error(body.error_message ?? 'Covalent API error');
  }

  if (body.data === undefined || body.data === null) {
    throw new Error('Covalent API returned no data');
  }

  return body.data;
}
