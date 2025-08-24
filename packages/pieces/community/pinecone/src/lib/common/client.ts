import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = `https://api.pinecone.io`;
export const API_VERSION = '2025-04';

export async function makeRequest(
  api_key: string,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  try {
    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        'Api-Key': api_key,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Pinecone-API-Version': API_VERSION,
      },
      body,
    });
    return response.body;
  } catch (error: any) {
    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}

export async function makeDataPlaneRequest(
  api_key: string,
  host: string,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  try {
    const response = await httpClient.sendRequest({
      method,
      url: `https://${host}${path}`,
      headers: {
        'Api-Key': api_key,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  } catch (error: any) {
    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}
