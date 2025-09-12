import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  HttpResponse,
  httpClient,
} from '@activepieces/pieces-common';

const BASE = 'https://api.vimeo.com';

export async function vimeoRequest<T = any>(
  token: string,
  method: HttpMethod,
  path: string,
  body?: unknown
): Promise<HttpResponse<T>> {
  const req: HttpRequest = {
    method,
    url: `${BASE}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    headers: { 'Content-Type': 'application/json' },
    body,
  };
  return httpClient.sendRequest<T>(req);
}

