import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const featheryCommon = {
  baseUrl: 'https://api.feathery.io/api',

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
    auth: string;
    headers?: Record<string, string>;
  }): Promise<T> {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${this.baseUrl}${url}`,
      headers: {
        'Authorization': `Token ${auth}`,
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


