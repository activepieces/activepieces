import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

export async function canvaApiCall<T>({
  accessToken,
  method,
  path,
  body,
  queryParams,
}: {
  accessToken: string;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  queryParams?: Record<string, string>;
}): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${CANVA_API_BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
    body,
    queryParams,
  });
  return response.body;
}

export const CANVA_API_BASE_URL = 'https://api.canva.com/rest/v1';
