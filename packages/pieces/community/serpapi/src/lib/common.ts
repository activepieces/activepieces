import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const serpapiCommon = {
  baseUrl: 'https://serpapi.com/search',

  async makeRequest(apiKey: string, params: Record<string, any>) {
    const queryParams = new URLSearchParams({
      api_key: apiKey,
      ...params,
    });

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${this.baseUrl}?${queryParams.toString()}`,
    });

    return response.body;
  },
};
