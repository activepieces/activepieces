import {
  httpClient,
  HttpMessageBody,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';

export type PlacidApiCallParams = {
  apiKey: string;
  method: HttpMethod;
  resourceUri: string;
  query?: Record<string, string | number | string[] | undefined>;
  body?: any;
};

export const BASE_URL = 'https://api.placid.app/api/rest';

export async function placidApiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  resourceUri,
  query,
  body,
}: PlacidApiCallParams): Promise<T> {
  if (!apiKey) {
    throw new Error('Placid API key is required for authentication');
  }

  const queryParams: QueryParams = {};
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        queryParams[key] = String(value);
      }
    }
  }

  const request: HttpRequest = {
    method,
    url: `${BASE_URL}${resourceUri}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    queryParams,
    body,
  };

  try {
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  } catch (error: any) {
    const statusCode = error.response?.status;
    const errorData = error.response?.body;

    switch (statusCode) {
      case 400:
        throw new Error(
          `Bad Request: ${
            errorData?.message || 'Invalid request parameters.'
          } Please verify your request body and template UUIDs.`
        );
      case 401:
        throw new Error(
          'Authentication Failed: Invalid or missing Placid API key. Please check your connection settings.'
        );
      case 403:
        throw new Error(
          'Access Forbidden: You do not have permission to access this resource. Check your Placid account permissions or plan limits.'
        );
      case 404:
        throw new Error(
          'Resource Not Found: The requested image, PDF, video, or template was not found. Please verify the resource ID.'
        );
      case 429:
        throw new Error(
          'Rate Limit Exceeded: Too many requests in a short time. Please slow down and try again later.'
        );
      case 500:
        throw new Error(
          'Internal Server Error: Placid is experiencing technical issues. Please try again later.'
        );
      case 502:
      case 503:
      case 504:
        throw new Error(
          'Service Unavailable: Placid service is temporarily down. Please wait and try again shortly.'
        );
      default:
        const message =
          errorData?.message ||
          errorData?.error ||
          error.message ||
          'An unknown error occurred while communicating with Placid.';
        throw new Error(
          `Placid API Error (${statusCode || 'Unknown'}): ${message}`
        );
    }
  }
}
