import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { BASE_URL } from './constants';

export async function katanaApiCall<T>(
  auth: string,
  method: HttpMethod,
  endpoint: string,
  body?: unknown,
  queryParams?: Record<string, string>
): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${endpoint}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth,
    },
    body,
    queryParams,
  });

  return response.body;
}
