import {
  AuthenticationType,
  httpClient,
  HttpMessageBody,
  HttpMethod,
  HttpResponse,
  QueryParams,
} from '@activepieces/pieces-common';
import { StreakBox } from './types';

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

export async function writeBoxFields({
  apiKey,
  boxKey,
  fields,
}: {
  apiKey: string;
  boxKey: string;
  fields: Array<{ fieldKey: string; value: unknown }>;
}): Promise<void> {
  for (const { fieldKey, value } of fields) {
    await streakApiCall({
      apiKey,
      method: HttpMethod.POST,
      path: `/api/v1/boxes/${encodeURIComponent(boxKey)}/fields/${encodeURIComponent(fieldKey)}`,
      contentType: 'application/json',
      body: { value },
    });
  }
}

export async function getStreakBox({
  apiKey,
  boxKey,
}: {
  apiKey: string;
  boxKey: string;
}): Promise<StreakBox> {
  const response = await streakApiCall<StreakBox>({
    apiKey,
    method: HttpMethod.GET,
    path: `/api/v1/boxes/${encodeURIComponent(boxKey)}`,
  });
  return response.body;
}

export const STREAK_BASE_URL = 'https://api.streak.com';
