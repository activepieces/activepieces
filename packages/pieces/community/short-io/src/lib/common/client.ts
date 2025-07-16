import {
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';

export type ShortIoAuthProps = {
  apiKey: string;
};

export type ShortIoApiCallParams = {
  method: HttpMethod;
  resourceUri: string;
  query?: Record<string, string | number | string[] | undefined>;
  body?: any;
  auth: ShortIoAuthProps;
};

export async function shortIoApiCall<T extends HttpMessageBody>({
  method,
  resourceUri,
  query,
  body,
  auth,
}: ShortIoApiCallParams): Promise<T> {
  const { apiKey } = auth;

  if (!apiKey) {
    throw new Error('Short.io API key is required for authentication');
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
    url: `https://api.short.io${resourceUri}`,
    headers: {
      Authorization: apiKey,
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

    const errorMessage = errorData?.message || error.message || 'Unknown error occurred';
    throw new Error(`Short.io API Error (${statusCode || 'Unknown'}): ${errorMessage}`);
  }
}
