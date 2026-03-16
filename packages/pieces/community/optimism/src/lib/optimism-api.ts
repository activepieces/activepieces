import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export async function fetchUrl(url: string): Promise<Record<string, unknown>> {
  const response = await httpClient.sendRequest<Record<string, unknown>>({
    method: HttpMethod.GET,
    url,
  });
  return response.body;
}
