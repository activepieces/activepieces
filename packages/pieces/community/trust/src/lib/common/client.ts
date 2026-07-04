import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpMessageBody,
  HttpResponse,
} from '@activepieces/pieces-common';

const BASE_URL = 'https://api.usetrust.app/v1';

export async function trustApiRequest<T extends HttpMessageBody>({
  apiKey,
  method,
  path,
  body,
  queryParams,
  headers,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
  headers?: Record<string, string>;
}): Promise<HttpResponse<T>> {
  return httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: 'apikey',
      password: apiKey,
    },
    body,
    queryParams,
    headers,
  });
}
