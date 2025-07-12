import {
  httpClient,
  HttpMessageBody,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';

export const BASE_URL = 'https://a.klaviyo.com/api';

export type KlaviyoApiCallParams = {
  apiKey: string;
  method: HttpMethod;
  resourceUri: string;
  query?: Record<string, string | number | string[] | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
};

export async function klaviyoApiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  resourceUri,
  query,
  body,
  headers = {},
}: KlaviyoApiCallParams): Promise<T> {
  const qs: QueryParams = {};

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        qs[key] = String(value);
      }
    }
  }

  const request: HttpRequest = {
    method,
    url: `${BASE_URL}${resourceUri}`,
    headers: {
      Authorization: `Klaviyo-API-Key ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.api+json',
      revision: '2025-04-15',
      ...headers,
    },
    queryParams: qs,
    body,
  };

  try {
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('Authentication failed. Please check your API key.');
    }

    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please wait and try again.');
    }

    if (error.response?.status >= 400 && error.response?.status < 500) {
      throw new Error(
        `Client error: ${error.response?.body?.message || JSON.stringify(error.response?.body)}`
      );
    }

    if (error.response?.status >= 500) {
      throw new Error('Server error from Klaviyo API. Please try again later.');
    }

    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}
