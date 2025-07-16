import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.fillout.com/v1/api';

export async function makeRequest(
  apiKey: string,
  method: HttpMethod,
  path: string,
  queryParams?: Record<string, any>,
  body?: unknown
) {
  try {
    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      queryParams,
      body,
    });

    return response.body;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Invalid API Key. Please check your authentication credentials.');
    }
    if (error.response?.status === 403) {
      throw new Error('Access denied. Please check your API key permissions.');
    }
    if (error.response?.status === 404) {
      throw new Error('Resource not found. Please check the form ID or submission ID.');
    }
    if (error.response?.status >= 500) {
      throw new Error('Fillout service error. Please try again later.');
    }
    throw new Error(`Request failed: ${error.message || 'Unknown error'}`);
  }
}
