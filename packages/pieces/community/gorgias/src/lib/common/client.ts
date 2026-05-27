import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpMessageBody,
  HttpResponse,
  QueryParams,
} from '@activepieces/pieces-common';

function buildBaseUrl(domain: string): string {
  const normalized = domain
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\.gorgias\.com.*$/i, '')
    .replace(/\/+$/, '');
  return `https://${normalized}.gorgias.com/api`;
}

async function call<T extends HttpMessageBody>({
  auth,
  method,
  path,
  body,
  queryParams,
}: {
  auth: GorgiasAuth;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: QueryParams;
}): Promise<HttpResponse<T>> {
  return httpClient.sendRequest<T>({
    method,
    url: `${buildBaseUrl(auth.domain)}${path}`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: auth.email,
      password: auth.api_key,
    },
    queryParams,
    body,
  });
}

export const gorgiasApi = { call, buildBaseUrl };

export type GorgiasAuth = {
  domain: string;
  email: string;
  api_key: string;
};
