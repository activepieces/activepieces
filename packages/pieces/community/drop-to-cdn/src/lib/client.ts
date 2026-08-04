import {
  HttpMethod,
  HttpMessageBody,
  httpClient,
} from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.droptocdn.com/v1';

export type DropToCdnApiCallParams = {
  apiKey: string;
  method: HttpMethod;
  resourceUri: string;
  body?: unknown;
  headers?: Record<string, string>;
};

export async function dropToCdnApiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  resourceUri,
  body,
  headers = {},
}: DropToCdnApiCallParams): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${resourceUri}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...headers,
    },
    body,
  });

  if (response.status >= 400) {
    const errorBody = response.body as Record<string, unknown> | undefined;
    const message =
      (typeof errorBody?.error === 'string' && errorBody.error) ||
      (typeof errorBody?.message === 'string' && errorBody.message) ||
      `Drop to CDN API error: ${response.status}`;
    throw new Error(message);
  }

  return response.body;
}
