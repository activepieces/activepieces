import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const serpapiCommon = {
  baseUrl: 'https://serpapi.com/search',

  async makeRequest(apiKey: string, params: Record<string, any>) {
    // Filter out undefined values
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined)
    );

    const queryParams = new URLSearchParams({
      api_key: apiKey,
      ...filteredParams
    });

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${this.baseUrl}?${queryParams.toString()}`,
    });

    return response.body;
  },
};
