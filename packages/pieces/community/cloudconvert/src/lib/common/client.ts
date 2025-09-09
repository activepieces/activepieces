import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  HttpResponse,
  httpClient,
} from '@activepieces/pieces-common';

export const CC_BASE = 'https://api.cloudconvert.com/v2';

export async function ccRequest<T = any>(
  token: string,
  method: HttpMethod,
  path: string,
  body?: unknown
): Promise<HttpResponse<T>> {
  const req: HttpRequest = {
    method,
    url: CC_BASE + path,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  };

  return httpClient.sendRequest<T>(req);
}

export async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

