import {
  HttpRequest,
  HttpMethod,
  httpClient,
  HttpMessageBody,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

type PinterestApiCallParams = {
  auth: OAuth2PropertyValue;
  method: HttpMethod;
  url: string;
  queryParams?: Record<string, string | number | boolean>;
  body?: unknown;
};

export async function pinterestApiCall<T extends HttpMessageBody>(
  params: PinterestApiCallParams
): Promise<T> {
  const {
    auth,
    method,
    url,
    queryParams,
    body,
  } = params;

  const normalizedQueryParams = queryParams
    ? Object.fromEntries(
        Object.entries(queryParams).map(([k, v]) => [k, String(v)])
      )
    : undefined;

  const request: HttpRequest = {
    method,
    url: `https://api.pinterest.com/v5${url}`,
    headers: {
      Authorization: `Bearer ${auth.access_token}`,
      'Content-Type': 'application/json',
    },
    queryParams: normalizedQueryParams,
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
        throw new Error(`Bad Request: ${errorData?.message ?? 'Invalid request.'}`);
      case 401:
        throw new Error('Unauthorized: Invalid or expired access token.');
      case 403:
        throw new Error('Forbidden: You do not have access to this resource.');
      case 404:
        throw new Error('Not Found: The requested resource was not found.');
      case 429:
        throw new Error('Too Many Requests: You’ve hit the Pinterest rate limit.');
      case 500:
      case 502:
      case 503:
      case 504:
        throw new Error('Pinterest API is currently unavailable. Please try again later.');
      default:
        throw new Error(
          `Pinterest API Error (${statusCode || 'unknown'}): ${
            errorData?.message || error.message || 'Unexpected error'
          }`
        );
    }
  }
}
