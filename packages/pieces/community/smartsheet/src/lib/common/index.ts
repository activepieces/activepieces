import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.smartsheet.com/2.0';

export async function smartsheetRequest<T>(
  token: string,
  method: HttpMethod,
  path: string,
  body?: unknown
): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  return response.body;
}
