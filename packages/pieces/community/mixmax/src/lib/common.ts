import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.mixmax.com/v1';

export function getAuthHeaders(auth: string) {
  return {
    'X-API-Token': auth,
    'Content-Type': 'application/json',
  };
}

export async function mixmaxGetRequest(auth: string, endpoint: string, queryParams?: Record<string, string>) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value) url.searchParams.set(key, value);
    }
  }

  return httpClient.sendRequest({
    method: HttpMethod.GET,
    url: url.toString(),
    headers: getAuthHeaders(auth),
  });
}

export async function mixmaxPostRequest(auth: string, endpoint: string, body: Record<string, unknown>) {
  return httpClient.sendRequest({
    method: HttpMethod.POST,
    url: `${BASE_URL}${endpoint}`,
    headers: getAuthHeaders(auth),
    body,
  });
}
