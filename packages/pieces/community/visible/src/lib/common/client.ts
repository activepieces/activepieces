import {
  HttpMessageBody,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';

export const VISIBLE_BASE_URL = 'https://api.visible.vc';

export async function visibleMakeRequest<T extends HttpMessageBody>(params: {
  accessToken: string;
  method: HttpMethod;
  path: string;
  queryParams?: QueryParams;
  body?: unknown;
}) {
  const response = await httpClient.sendRequest<T>({
    method: params.method,
    url: `${VISIBLE_BASE_URL}${params.path}`,
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    },
    queryParams: params.queryParams,
    body: params.body,
  });

  return response.body;
}
