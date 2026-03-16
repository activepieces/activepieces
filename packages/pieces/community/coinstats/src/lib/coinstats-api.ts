import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export function makeClient(apiKey: string) {
  const baseUrl = 'https://openapiv1.coinstats.app';
  const authHeaders = { 'X-API-KEY': apiKey };

  return {
    async getCoins(params: { limit?: number; skip?: number }) {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/coins`,
        queryParams: {
          limit: String(params.limit ?? 20),
          skip: String(params.skip ?? 0),
        },
        headers: authHeaders,
      });
      return response.body;
    },

    async getCoin(coinId: string) {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/coins/${coinId}`,
        headers: authHeaders,
      });
      return response.body;
    },

    async getCoinCharts(coinId: string, params: { period?: string }) {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/coins/${coinId}/charts`,
        queryParams: {
          period: params.period ?? '1d',
        },
        headers: authHeaders,
      });
      return response.body;
    },

    async getMarkets(params: { skip?: number; limit?: number }) {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/markets`,
        queryParams: {
          skip: String(params.skip ?? 0),
          limit: String(params.limit ?? 20),
        },
        headers: authHeaders,
      });
      return response.body;
    },

    async getNews(params: { skip?: number; limit?: number }) {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/news`,
        queryParams: {
          skip: String(params.skip ?? 0),
          limit: String(params.limit ?? 20),
        },
        headers: authHeaders,
      });
      return response.body;
    },
  };
}
