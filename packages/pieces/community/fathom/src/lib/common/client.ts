import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.fathom.ai/external/v1';

export async function makeRequest(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  try {
    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body,
    });

    // Handle successful responses
    if (response.status >= 200 && response.status < 300) {
      return response.body;
    }

    // Handle specific error cases
    switch (response.status) {
      case 400:
        throw new Error(
          'Bad Request: The request could not be processed. Please check your input parameters.'
        );
      case 401:
        throw new Error(
          'Unauthorized: Invalid API key. Please check your API key and try again.'
        );
      case 403:
        throw new Error(
          'Forbidden: The API key does not have permission to access this resource.'
        );
      case 404:
        throw new Error(
          'Not Found: The requested resource could not be found.'
        );
      case 429:
        throw new Error(
          'Rate Limit Exceeded: Too many requests. Please wait a moment and try again.'
        );
      case 500:
        throw new Error(
          'Internal Server Error: Fathom server encountered an unexpected condition.'
        );
      default:
        throw new Error(
          `HTTP ${response.status}: ${
            response.body?.message || 'Unknown error occurred'
          }`
        );
    }
  } catch (error: any) {
    // Re-throw if it's already our custom error
    if (
      error.message.includes('Bad Request') ||
      error.message.includes('Unauthorized') ||
      error.message.includes('Forbidden') ||
      error.message.includes('Not Found') ||
      error.message.includes('Rate Limit') ||
      error.message.includes('Internal Server Error')
    ) {
      throw error;
    }

    // Handle network or other unexpected errors
    throw new Error(`Request failed: ${error.message || String(error)}`);
  }
}

