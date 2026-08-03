import { AuthenticationType, HttpMessageBody, HttpMethod, HttpResponse, QueryParams, httpClient } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { produktlyAuth } from './auth';

export async function produktlyApiCall<T extends HttpMessageBody>({
  auth,
  method,
  path,
  body,
  queryParams,
}: {
  auth: ProduktlyAuth;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: QueryParams;
}): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method,
    url: `${PRODUKTLY_BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.secret_text,
    },
    queryParams,
    body,
  });
}

export const PRODUKTLY_BASE_URL = 'https://api.produktly.com/api/v1';

export type ProduktlyAuth = AppConnectionValueForAuthProperty<typeof produktlyAuth>;
