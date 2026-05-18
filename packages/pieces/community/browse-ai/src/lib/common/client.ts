import {
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';

export type BrowseAiAuthProps = {
  apiKey: string;
};

export type BrowseAiApiCallParams = {
  method: HttpMethod;
  resourceUri: string;
  query?: Record<string, string | number | string[] | undefined>;
  body?: unknown;
  auth: BrowseAiAuthProps;
};

export async function browseAiApiCall<T extends HttpMessageBody>({
  method,
  resourceUri,
  query,
  body,
  auth,
}: BrowseAiApiCallParams): Promise<T> {
  const { apiKey } = auth;

  if (!apiKey) {
    throw new Error('Browse AI API key is required for authentication');
  }

  const queryParams: QueryParams = {};

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        queryParams[key] = String(value);
      }
    }
  }

  const baseUrl = `https://api.browse.ai/v2`;

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
        throw new Error(`Bad Request: ${errorData?.message || 'Invalid parameters'}`);
      case 401:
        throw new Error('Unauthorized: Invalid API key. Please check your credentials.');
      case 403:
        throw new Error('Forbidden: You do not have permission to access this resource.');
      case 404:
        throw new Error('Not Found: The requested resource does not exist.');
      case 429:
        throw new Error('Rate Limit Exceeded: Please slow down your requests.');
      case 500:
        throw new Error('Internal Server Error: Something went wrong on Browse AI’s side.');
      default:
        {
        const message = errorData?.message || error.message || 'Unknown error';
        throw new Error(`Browse AI API Error (${statusCode || 'Unknown'}): ${message}`);
        }

    }
  }
}
