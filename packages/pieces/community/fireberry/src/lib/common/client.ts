import {
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';

export type FireberryAuthProps = {
  apiKey: string;
};

export type FireberryApiCallParams = {
  method: HttpMethod;
  resourceUri: string;
  query?: Record<string, string | number | string[] | undefined>;
  body?: any;
  auth: FireberryAuthProps;
};

export async function fireberryApiCall<T extends HttpMessageBody>({
  method,
  resourceUri,
  query,
  body,
  auth,
}: FireberryApiCallParams): Promise<T> {
  const { apiKey } = auth;

  if (!apiKey) {
    throw new Error('Fireberry API key is required');
  }

  const queryParams: QueryParams = {};

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        queryParams[key] = String(value);
      }
    }
  }

  const baseUrl = 'https://api.fireberry.com/api';

  const request: HttpRequest = {
    method,
    url: `${baseUrl}${resourceUri}`,
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
    const errorData = error.response?.data;

    switch (statusCode) {
      case 400:
        throw new Error(`Bad Request: ${errorData?.message || 'Invalid parameters.'}`);
      case 401:
        throw new Error(`Unauthorized: Invalid or missing API key.`);
      case 403:
        throw new Error(`Forbidden: Access denied. Check permissions.`);
      case 404:
        throw new Error(`Not Found: Resource does not exist.`);
      case 429:
        throw new Error(`Rate Limit: Too many requests. Please try again later.`);
      case 500:
        throw new Error(`Internal Server Error: Try again later.`);
      default:
        const message =
          errorData?.message || error.message || 'An unknown error occurred.';
        throw new Error(`Fireberry API Error (${statusCode || 'Unknown'}): ${message}`);
    }
  }
}
