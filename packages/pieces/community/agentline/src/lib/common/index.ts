import {
  HttpMethod,
  HttpMessageBody,
  httpClient,
} from '@activepieces/pieces-common';

const BASE_URL = 'https://api.agentline.cloud';

export async function agentlineApiCall<T extends HttpMessageBody>(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: Record<string, unknown>,
  queryParams?: Record<string, string>,
) {
  return await httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body,
    queryParams,
  });
}
