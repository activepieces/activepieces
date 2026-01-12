import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const featheryCommon = {
  baseUrl: 'https://api.feathery.io/api',

  async apiCall<T>({
    method,
    url,
    body,
    apiKey,
    headers,
  }: {
    method: HttpMethod;
    url: string;
    body?: any;
    apiKey: string;
    headers?: Record<string, string>;
  }): Promise<T> {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${this.baseUrl}${url}`,
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
        ...headers,
      },
      body,
    });

    if (response.status >= 400) {
      throw new Error(`Feathery API error: ${response.status} - ${JSON.stringify(response.body)}`);
    }

    return response.body;
  },
};


