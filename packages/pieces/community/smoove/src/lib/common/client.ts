import {
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';

export type SmooveAuthProps = {
  apiKey: string;
};

export type SmooveApiCallParams = {
  method: HttpMethod;
  resourceUri: string;
  query?: Record<string, string | number | string[] | undefined>;
  body?: any;
  auth: SmooveAuthProps;
};

export async function smooveApiCall<T extends HttpMessageBody>({
  method,
  resourceUri,
  query,
  body,
  auth,
}: SmooveApiCallParams): Promise<T> {
  const { apiKey } = auth;

  if (!apiKey) {
    throw new Error('Smoove API key is required for authentication');
  }

  const queryParams: QueryParams = {};
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        queryParams[key] = String(value);
      }
    }
  }

  const baseUrl = 'https://rest.smoove.io/v1';

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
        throw new Error(`Bad Request: ${errorData?.message || 'Invalid request'}`);
      case 401:
        throw new Error('Unauthorized: Invalid API key. Please verify your Smoove API credentials.');
      case 403:
        throw new Error('Forbidden: You do not have access to this resource.');
      case 404:
        throw new Error('Not Found: The requested resource does not exist.');
      case 429:
        throw new Error('Rate Limit Exceeded: Too many requests. Please wait and try again.');
      case 500:
      case 502:
      case 503:
      case 504:
        throw new Error('Smoove service is temporarily unavailable. Please try again later.');
      default:
        const errorMessage = errorData?.message || error.message || 'Unknown error occurred';
        throw new Error(`Smoove API Error (${statusCode || 'Unknown'}): ${errorMessage}`);
    }
  }
}
