import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export async function ribbonRequest(path: string) {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: path,
  });
  return response.body;
}
