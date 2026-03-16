import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const DYDX_BASE_URL = 'https://indexer.dydx.trade';

export async function dydxRequest(path: string, params?: Record<string, string>) {
  const url = new URL(DYDX_BASE_URL + path);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: url.toString(),
  });
  return response.body;
}
