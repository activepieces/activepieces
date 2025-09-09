import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  HttpResponse,
  httpClient,
} from '@activepieces/pieces-common';

export const RUNWAY_BASE = 'https://api.runwayml.com/v1';

export async function runwayRequest<T = any>(
  token: string,
  method: HttpMethod,
  path: string,
  body?: unknown
): Promise<HttpResponse<T>> {
  const req: HttpRequest = {
    method,
    url: `${RUNWAY_BASE}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    headers: { 'Content-Type': 'application/json' },
    body,
  };
  return httpClient.sendRequest<T>(req);
}

