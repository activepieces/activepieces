import {
  httpClient,
  HttpMethod,
  HttpRequest,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { ScreenpipeAuth } from '../auth';

export function getBaseUrl(auth: ScreenpipeAuth): string {
  return auth.baseUrl.replace(/\/$/, '');
}

export async function screenpipeApiRequest<T>(params: {
  auth: ScreenpipeAuth;
  method: HttpMethod;
  endpoint: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}): Promise<T> {
  const baseUrl = getBaseUrl(params.auth);
  const request: HttpRequest = {
    method: params.method,
    url: `${baseUrl}${params.endpoint}`,
    authentication: {
      type: AuthenticationType.NONE,
    },
    body: params.body,
    queryParams: params.queryParams,
  };

  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}
