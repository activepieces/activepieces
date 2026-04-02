import {
  AuthenticationType,
  httpClient,
  HttpMessageBody,
  HttpMethod,
  HttpRequest,
  HttpResponse,
  QueryParams,
} from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { giteaAuth } from '../auth';

export type GiteaApiCallParams = {
  auth: AppConnectionValueForAuthProperty<typeof giteaAuth>;
  method: HttpMethod;
  resourceUri: string;
  query?: QueryParams;
  body?: Record<string, unknown>;
};

export type WebhookInformation = {
  webhookId: number;
  repo: string;
  owner: string;
};

export async function giteaApiCall<T extends HttpMessageBody>({
  auth,
  method,
  resourceUri,
  query,
  body,
}: GiteaApiCallParams): Promise<HttpResponse<T>> {
  const request: HttpRequest = {
    method,
    url: baseUrl(auth) + resourceUri,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
    queryParams: query,
    body,
  };

  return await httpClient.sendRequest<T>(request);
}

export async function giteaPaginatedApiCall<T extends HttpMessageBody>({
  auth,
  method,
  resourceUri,
  query,
  body,
}: GiteaApiCallParams): Promise<T[]> {
  const qs = query ? { ...query } : {};
  qs['page'] = '1';
  qs['per_page'] = '100';

  const resultData: T[] = [];
  let hasMoreItems = true;

  while (hasMoreItems) {
    const response = await giteaApiCall<T[]>({
      auth,
      method,
      resourceUri,
      query: qs,
      body,
    });

    const data = response.body ?? [];

    resultData.push(...data);

    if (data.length < 100) {
      hasMoreItems = false;
    } else {
      qs['page'] = (parseInt(qs['page'] as string) + 1).toString();
    }
  }

  return resultData;
}

export function baseUrl(auth: AppConnectionValueForAuthProperty<typeof giteaAuth>): string {
  const instanceUrl = (auth.props?.['baseUrl'] as string) ?? 'https://gitea.com';
  return instanceUrl.replace(/\/$/, '') + '/api/v1';
}