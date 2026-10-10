import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export type FigraniumClientParams = {
  baseUrl: string;
  apiKey: string;
  method: HttpMethod;
  resourceUri: string;
  body?: unknown;
};

export async function figraniumClient<T>({
  baseUrl,
  apiKey,
  method,
  resourceUri,
  body,
}: FigraniumClientParams): Promise<T> {
  const url = `${baseUrl.replace(/\/+$/, '')}${resourceUri}`;
  const response = await httpClient.sendRequest<T>({
    method,
    url,
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body,
  });
  return response.body;
}
