import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const parserExpertCommon = {
  baseUrl: 'https://api.parser.expert',

  async apiCall<T>({
    method,
    url,
    auth,
    body,
    headers,
    queryParams,
  }: {
    method: HttpMethod;
    url: string;
    auth: string;
    body?: any;
    headers?: Record<string, string>;
    queryParams?: Record<string, string>;
  }): Promise<T> {
    let fullUrl = `${this.baseUrl}${url}`;
    
    if (queryParams && Object.keys(queryParams).length > 0) {
      const params = new URLSearchParams(queryParams);
      fullUrl += `?${params.toString()}`;
    }

    const response = await httpClient.sendRequest<T>({
      method,
      url: fullUrl,
      headers: {
        'X-API-Key': auth,
        ...headers,
      },
      body,
    });

    if (response.status >= 400) {
      throw new Error(`Parser Expert API error: ${response.status} ${JSON.stringify(response.body)}`);
    }

    return response.body;
  },
};

