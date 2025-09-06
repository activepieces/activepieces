import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';

interface MakeRequestParams {
  method: HttpMethod;
  apiKey: string;
  baseUrl: string;
  path: string;
  body?: Record<string, unknown>;
  queryParams?: Record<string, unknown>;
  headers?: Record<string, string>;
}

export const makeRequest = async ({
  method,
  apiKey,
  baseUrl,
  path,
  body = {},
  queryParams = {},
  headers = {},
}: MakeRequestParams) => {
  const response = await httpClient.sendRequest({
    method,
    url: `${baseUrl}${path}`,
    body,
    queryParams,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...headers,
    },
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: apiKey,
    },
  });

  return response.body;
};