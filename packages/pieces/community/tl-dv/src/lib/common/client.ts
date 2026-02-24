import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const tldvCommon = {
  baseUrl: 'https://pasta.tldv.io',

  async apiCall<T>({
    method,
    url,
    body,
    auth,
    headers,
  }: {
    method: HttpMethod;
    url: string;
    body?: any;
    auth: string | { apiKey: string };
    headers?: Record<string, string>;
  }): Promise<T> {
    const apiKey = typeof auth === 'string' ? auth : auth.apiKey;
    
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${this.baseUrl}${url}`,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        ...headers,
      },
      body,
    });

    if (response.status >= 400) {
      throw new Error(`tl;dv API error: ${response.status} - ${JSON.stringify(response.body)}`);
    }

    return response.body;
  },
};

