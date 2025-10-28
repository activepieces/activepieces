import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = `https://api.aircall.io/v1`;

export async function makeRequest(
  auth: { username: string; password: string },
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  try {
    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      authentication:{
        type:AuthenticationType.BASIC,
        username:auth.username,
        password:auth.password
      },
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });

    // Handle different status codes
    if (response.status >= 200 && response.status < 300) {
      return response.body;
    }

    // Handle specific error cases
    switch (response.status) {
      case 400:
        throw new Error(
          `Bad Request: The request could not be processed. Please check your input parameters.`
        );
      case 403:
        throw new Error(
          `Forbidden: Invalid authentication credentials or insufficient permissions.`
        );
      case 404:
        throw new Error(
          `Not Found: The requested resource could not be found.`
        );
      case 405:
        throw new Error(
          `Method Not Allowed: The HTTP method is not supported for this endpoint.`
        );
      case 500:
        throw new Error(
          `Internal Server Error: Aircall server encountered an unexpected condition.`
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
      error.message.includes('Forbidden') ||
      error.message.includes('Not Found') ||
      error.message.includes('Method Not Allowed') ||
      error.message.includes('Internal Server Error')
    ) {
      throw error;
    }

    // Handle network or other unexpected errors
    throw new Error(`Request failed: ${error.message || String(error)}`);
  }
}
