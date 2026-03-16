import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History',
  description: 'Retrieve the last 30 days of TVL history for Exactly Protocol from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Array<{ date: number; totalLiquidityUSD: number }>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/v2/historicalChainTvl/exactly',
    });

    let history: Array<{ date: number; totalLiquidityUSD: number }> = [];

    if (Array.isArray(response.body)) {
      history = response.body;
    } else {
      // Fallback: fetch from protocol endpoint and extract tvl array
      const protocolRes = await httpClient.sendRequest<{
        tvl?: Array<{ date: number; totalLiquidityUSD: number }>;
      }>({
        method: HttpMethod.GET,
        url: 'https://api.llama.fi/protocol/exactly',
      });
      history = (protocolRes.body as { tvl?: Array<{ date: number; totalLiquidityUSD: number }> }).tvl ?? [];
    }

    const last30 = history.slice(-30).map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      timestamp: entry.date,
      tvlUsd: entry.totalLiquidityUSD,
    }));

    return {
      days: last30.length,
      history: last30,
    };
  },
});
