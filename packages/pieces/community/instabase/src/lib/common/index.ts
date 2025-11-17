import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export interface InstabaseAuth {
  apiToken: string;
  ibContext?: string;
  apiRoot: string;
}

export const createInstabaseHeaders = (auth: InstabaseAuth): Record<string, string> => {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${auth.apiToken}`,
    'Content-Type': 'application/json',
  };

  if (auth.ibContext) {
    headers['IB-Context'] = auth.ibContext;
  }

  return headers;
};

export const makeInstabaseApiCall = async <T = any>(
  auth: InstabaseAuth,
  endpoint: string,
  method: HttpMethod = HttpMethod.GET,
  body?: any
): Promise<T> => {
  const url = `${auth.apiRoot}${endpoint}`;
  const headers = createInstabaseHeaders(auth);

  const response = await httpClient.sendRequest<T>({
    method,
    url,
    headers,
    body,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.apiToken,
    },
  });

  return response.body;
};
