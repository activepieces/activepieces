import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.geckoterminal.com/api/v2';
const ACCEPT_HEADER = 'application/json;version=20230302';

export async function geckoTerminalApiCall(
  endpoint: string,
  params?: Record<string, string | number | undefined>
): Promise<unknown> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: url.toString(),
    headers: {
      Accept: ACCEPT_HEADER,
    },
  });

  return response.body;
}
