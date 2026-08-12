import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';

type FigraniumRequest = {
  baseUrl: string;
  apiKey: string;
  method: HttpMethod;
  resourceUri: string;
  body?: Record<string, unknown>;
  queryParams?: QueryParams;
};

export async function figraniumClient<T>({
  baseUrl,
  apiKey,
  method,
  resourceUri,
  body,
  queryParams,
}: FigraniumRequest): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl.replace(/\/+$/, '')}${resourceUri}`,
    headers: {
      'x-api-key': apiKey,
    },
    body,
    queryParams,
  });
  return response.body;
}

export type FigraniumTask = {
  id: string;
  name?: string;
  description?: string;
};

export type FigraniumTaskListResponse = {
  tasks: FigraniumTask[];
};
