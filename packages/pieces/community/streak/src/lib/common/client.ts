import {
  AuthenticationType,
  httpClient,
  HttpMessageBody,
  HttpMethod,
  HttpResponse,
  QueryParams,
} from '@activepieces/pieces-common';

export async function streakApiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  path,
  queryParams,
  body,
  contentType,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  queryParams?: QueryParams;
  body?: unknown;
  contentType?: 'application/json' | 'application/x-www-form-urlencoded';
}): Promise<HttpResponse<T>> {
  const headers: Record<string, string> = {};
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  return await httpClient.sendRequest<T>({
    method,
    url: `${STREAK_BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: apiKey,
      password: '',
    },
    queryParams,
    headers,
    body,
  });
}

export const STREAK_BASE_URL = 'https://api.streak.com';
