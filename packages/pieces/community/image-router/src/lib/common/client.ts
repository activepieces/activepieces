import { httpClient, HttpMethod, HttpMessageBody } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.imagerouter.io';

export type ImageRouterApiCallParams = {
  apiKey: string;
  method: HttpMethod;
  resourceUri: string;
  body?: any;
  headers?: Record<string, string>;
};

export async function imageRouterApiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  resourceUri,
  body,
  headers = {},
}: ImageRouterApiCallParams): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${resourceUri}`,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...headers,
    },
    body,
  });

  if (response.status >= 400) {
    const errorMessage = (response.body as any)?.error?.message || 
                        (response.body as any)?.message || 
                        `ImageRouter API error: ${response.status}`;
    throw new Error(errorMessage);
  }

  return response.body;
}

