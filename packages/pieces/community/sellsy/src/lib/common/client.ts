import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export interface SellsyAuth {
  access_token: string;
}

export interface SellsyClient {
  makeRequest<T>(
    method: HttpMethod,
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<T>;
}

export const createSellsyClient = (auth: SellsyAuth): SellsyClient => {
  const baseUrl = 'https://api.sellsy.com/v2';

  return {
    async makeRequest<T>(
      method: HttpMethod,
      endpoint: string,
      body?: any,
      headers?: Record<string, string>
    ): Promise<T> {
      const response = await httpClient.sendRequest<T>({
        method,
        url: `${baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
          ...headers,
        },
        body,
      });

      if (response.status >= 400) {
        throw new Error(`Sellsy API error: ${response.status} ${JSON.stringify(response.body)}`);
      }

      return response.body;
    },
  };
};

export const makeRequest = async <T>(
  auth: SellsyAuth,
  method: HttpMethod,
  endpoint: string,
  body?: any,
  headers?: Record<string, string>
): Promise<T> => {
  const client = createSellsyClient(auth);
  return client.makeRequest<T>(method, endpoint, body, headers);
}; 