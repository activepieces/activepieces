import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.pinterest.com/v5';

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
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  } catch (error: any) {
    // Handle Pinterest API specific error codes
    if (error.response?.status) {
      const status = error.response.status;
      const errorData = error.response.body;

      switch (status) {
        case 400:
          throw new Error(
            `Bad Request: ${
              errorData?.message ||
              'Invalid request parameters. Please check your input and try again.'
            }`
          );

        case 401:
          throw new Error(
            'Authentication Failed: Your Pinterest access token is invalid or expired. Please reconnect your Pinterest account.'
          );

        case 403:
          throw new Error(
            "Access Denied: You don't have permission to access this resource. Please check your Pinterest account permissions."
          );

        case 404:
          throw new Error(
            'Resource Not Found: The requested Pinterest resource (board, pin, etc.) could not be found. Please verify the resource exists.'
          );

        case 429:
          throw new Error(
            "Rate Limit Exceeded: You've exceeded Pinterest's API rate limits. Please wait a moment and try again."
          );

        case 500:
          throw new Error(
            "Pinterest Server Error: Pinterest's servers are experiencing issues. Please try again later."
          );

        case 502:
          throw new Error(
            "Bad Gateway: Pinterest's servers are temporarily unavailable. Please try again later."
          );

        case 503:
          throw new Error(
            "Service Unavailable: Pinterest's API service is temporarily down. Please try again later."
          );

        default:
          throw new Error(
            `Pinterest API Error (${status}): ${
              errorData?.message ||
              'An unexpected error occurred while communicating with Pinterest.'
            }`
          );
      }
    }

    // Handle network or other errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error(
        'Network Error: Unable to connect to Pinterest API. Please check your internet connection and try again.'
      );
    }

    if (error.code === 'ETIMEDOUT') {
      throw new Error(
        'Request Timeout: The request to Pinterest API timed out. Please try again.'
      );
    }

    // Generic error fallback
    throw new Error(
      `Unexpected Error: ${
        error.message ||
        'An unexpected error occurred while processing your request.'
      }`
    );
  }
}
