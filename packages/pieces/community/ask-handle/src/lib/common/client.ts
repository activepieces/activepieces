import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const BASE_URL = 'https://dashboard.askhandle.com/api/v1';

export async function askHandleApiCall(
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
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    if (response.status >= 200 && response.status < 300) {
      return response.body;
    }

    throw new Error(
      `AskHandle API error: ${response.status} ${JSON.stringify(response.body)}`
    );
  } catch (error: any) {
    const statusCode = error.response?.status;

    if (statusCode) {
      switch (statusCode) {
        case 400:
          throw new Error(
            `Bad Request: Invalid request parameters. Please check your data.`
          );
        case 401:
          throw new Error(
            'Authentication Failed: Invalid API key. Please verify your AskHandle credentials.'
          );
        case 403:
          throw new Error(
            'Access Forbidden: You do not have permission to access this resource.'
          );
        case 404:
          throw new Error(
            'Resource Not Found: The requested resource does not exist.'
          );
        case 500:
        case 502:
        case 503:
        case 504:
          throw new Error(
            `Server Error (${statusCode}): AskHandle API is experiencing issues. Please try again later.`
          );
        default:
          throw new Error(
            `AskHandle API Error (${statusCode}): ${error.message || 'Unknown error occurred'}`
          );
      }
    }

    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}

