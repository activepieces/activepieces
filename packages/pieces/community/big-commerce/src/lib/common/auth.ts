import {
  HttpMessageBody,
  HttpMethod,
  HttpResponse,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';

export type BigCommerceAuth = {
  storeHash: string;
  accessToken: string;
};

export function getBaseUrl(storeHash: string, version: 'v2' | 'v3' = 'v3'): string {
  return `https://api.bigcommerce.com/stores/${storeHash}/${version}`;
}

export function sendBigCommerceRequest<T = HttpMessageBody>(data: {
  url: string;
  method: HttpMethod;
  body?: HttpMessageBody;
  queryParams?: QueryParams;
  auth: BigCommerceAuth;
  version?: 'v2' | 'v3';
}): Promise<HttpResponse<T>> {
  return httpClient.sendRequest<T>({
    url: `${getBaseUrl(data.auth.storeHash, data.version || 'v3')}${data.url}`,
    method: data.method,
    body: data.body,
    queryParams: data.queryParams,
    headers: {
      'X-Auth-Token': data.auth.accessToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });
}

export * from './props';

