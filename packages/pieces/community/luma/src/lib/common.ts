import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.lu.ma/public/v1';

async function makeRequest({
  apiKey,
  method,
  path,
  body,
  queryParams,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  queryParams?: Record<string, string>;
}) {
  const response = await httpClient.sendRequest({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      'x-luma-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body,
    queryParams,
  });
  return response.body;
}

export const lumaCommon = { BASE_URL, makeRequest };
