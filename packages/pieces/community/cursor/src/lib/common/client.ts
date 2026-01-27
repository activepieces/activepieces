import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { CursorAuth } from './auth';

const BASE_URL = 'https://api.cursor.com';

export async function makeCursorRequest<T = any>(
  auth: CursorAuth,
  endpoint: string,
  method: HttpMethod = HttpMethod.GET,
  body?: unknown,
  queryParams?: Record<string, any>
): Promise<T> {
  const response = await httpClient.sendRequest({
    method,
    url: `${BASE_URL}${endpoint}`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: auth.secret_text,
      password: '',
    },
    headers: {
      'Content-Type': 'application/json',
    },
    body,
    queryParams,
  });

  return response.body as T;
}

