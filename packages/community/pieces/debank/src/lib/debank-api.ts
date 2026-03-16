import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const BASE_URL = 'https://pro-openapi.debank.com/v1';

export async function debankRequest(
  accessKey: string,
  path: string,
  params?: Record<string, string>
) {
  return httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${BASE_URL}${path}`,
    headers: {
      AccessKey: accessKey,
      Accept: 'application/json',
    },
    queryParams: params,
  });
}
