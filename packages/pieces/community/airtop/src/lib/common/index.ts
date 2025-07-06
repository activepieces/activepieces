import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.airtop.ai/api/v1';


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
    if (error.response?.status === 404) {
      throw new Error(
        'Resource not found. Please check'
      );
    }
     if (error.response?.status === 422) {
       throw new Error('Request unprocessable entity error');
     }
    if (error.response?.status >= 500) {
      throw new Error('Airtop server error. Please try again later.');
    }
    throw new Error(`Request failed: ${error.message || 'Unknown error'}`);
  }
}
