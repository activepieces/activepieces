import {
  HttpMethod,
  HttpResponse,
  httpClient,
} from '@activepieces/pieces-common';
import {
  getZendeskAuthHeader,
  getZendeskHttpClientAuth,
  getZendeskSubdomain,
  ZendeskAuthValue,
} from '../auth';

export async function sendZendeskRequest<T = any>({
  auth,
  urlPath,
  method = HttpMethod.GET,
  queryParams,
  headers = {},
  body,
}: {
  auth: ZendeskAuthValue;
  urlPath: string;
  method?: HttpMethod;
  queryParams?: Record<string, string>;
  headers?: Record<string, string>;
  body?: any;
}): Promise<HttpResponse<T>> {
  const subdomain = getZendeskSubdomain(auth);
  const normalizedPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
  const url = `https://${subdomain}.zendesk.com${normalizedPath}`;

  return await httpClient.sendRequest<T>({
    method,
    url,
    queryParams,
    headers: {
      ...headers,
      ...getZendeskAuthHeader(auth),
    },
    authentication: getZendeskHttpClientAuth(auth),
    body,
  });
}
