import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

const POSTMARK_API_BASE = 'https://api.postmarkapp.com';

export async function postmarkApiRequest<T>(params: {
  apiKey: string;
  method: HttpMethod;
  endpoint: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}): Promise<T> {
  const request: HttpRequest = {
    method: params.method,
    url: `${POSTMARK_API_BASE}${params.endpoint}`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': params.apiKey,
    },
    body: params.body,
    queryParams: params.queryParams,
  };

  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}
