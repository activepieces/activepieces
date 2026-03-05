import {
  httpClient,
  HttpMethod,
  HttpRequest,
  AuthenticationType,
} from '@activepieces/pieces-common';

const BUTTONDOWN_API_BASE = 'https://api.buttondown.email/v1';

export async function buttondownApiRequest<T>(params: {
  apiKey: string;
  method: HttpMethod;
  endpoint: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}): Promise<T> {
  const request: HttpRequest = {
    method: params.method,
    url: `${BUTTONDOWN_API_BASE}${params.endpoint}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: params.apiKey,
    },
    body: params.body,
    queryParams: params.queryParams,
  };

  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}
