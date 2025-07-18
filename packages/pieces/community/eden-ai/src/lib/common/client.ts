import {
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';

export type EdenAuthProps = {
  apiKey: string;
};

export type EdenApiCallParams = {
  method: HttpMethod;
  resourceUri: string;
  query?: Record<string, string | number | string[] | undefined>;
  body?: any;
  auth: EdenAuthProps;
};

export async function edenApiCall<T extends HttpMessageBody>({
  method,
  resourceUri,
  query,
  body,
  auth,
}: EdenApiCallParams): Promise<T> {
  const { apiKey } = auth;

  if (!apiKey) {
    throw new Error('Eden AI API key is required for authentication');
  }

  const queryParams: QueryParams = {};

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        queryParams[key] = String(value);
      }
    }
  }

  const baseUrl = `https://api.edenai.run/v2`;

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
        throw new Error(`Bad Request: ${errorData?.message || 'Invalid request payload.'}`);
      case 401:
        throw new Error(`Unauthorized: Invalid Eden AI API Key.`);
      case 403:
        throw new Error(`Forbidden: You are not allowed to access this resource.`);
      case 404:
        throw new Error(`Not Found: The requested endpoint/resource does not exist.`);
      case 429:
        throw new Error(`Rate Limit Exceeded: Too many requests. Please try again later.`);
      case 500:
        throw new Error(`Internal Server Error: Eden AI is experiencing issues. Please try again.`);
      default:
        const errorMessage =
          errorData?.message || error.message || 'Unknown error occurred';
        throw new Error(`Eden AI API Error (${statusCode || 'Unknown'}): ${errorMessage}`);
    }
  }
}
