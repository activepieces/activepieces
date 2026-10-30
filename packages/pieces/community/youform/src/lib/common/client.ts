import {
  AuthenticationType,
  HttpMethod,
  httpClient,
  QueryParams,
} from '@activepieces/pieces-common';

import type { YouformAuthValue } from './types';

function baseUrl(): string {
  return BASE_URL;
}

async function request<T>({
  auth,
  method,
  path,
  query,
  body,
}: RequestParams & { auth: YouformAuthValue }): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.secret_text,
    },
    queryParams: query,
    body,
  });
  return response.body;
}

export const youformClient = { baseUrl, request };

const BASE_URL = 'https://app.youform.com/api';

type RequestParams = {
  method: HttpMethod;
  path: string;
  query?: QueryParams;
  body?: unknown;
};
