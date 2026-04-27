import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.aiprise.com/api/v1';

async function makeRequest<T>({
  apiKey,
  method,
  path,
  body,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
}): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body,
  });
  return response.body;
}

export const aiprise = {
  BASE_URL,
  makeRequest,
};
