import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export async function fetchUrl(url: string) {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url,
  });
  return response.body;
}
